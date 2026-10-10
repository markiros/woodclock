import ScreenSaver
import QuartzCore
import os.log

@objc(WoodClockView)
final class WoodClockView: ScreenSaverView {

    private struct Item {
        let layer: CALayer
        let spec: PresetLayer
        let offset: CGPoint      // для теней: смещение в долях холста (y вниз)
        let rotates: String?
    }

    private let clock = CALayer()
    private var items: [Item] = []
    private var presets: [Preset] = []
    private var settings = Settings.load()
    private var sheet: ConfigureSheet?
    private var lastSecond = -1

    override init?(frame: NSRect, isPreview: Bool) {
        super.init(frame: frame, isPreview: isPreview)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    deinit {
        DistributedNotificationCenter.default().removeObserver(self)
        NotificationCenter.default.removeObserver(self)
    }

    private func setup() {
        wantsLayer = true
        layer?.backgroundColor = NSColor.black.cgColor
        layer?.addSublayer(clock)
        presets = Preset.loadAll(bundle: Bundle(for: WoodClockView.self))
        applySettings()

        // macOS 14+: legacyScreenSaver не вызывает stopAnimation и не выгружает старые экземпляры.
        DistributedNotificationCenter.default().addObserver(
            self, selector: #selector(screenSaverWillStop),
            name: Notification.Name("com.apple.screensaver.willstop"), object: nil)
        NotificationCenter.default.addObserver(
            self, selector: #selector(settingsDidChange),
            name: WoodClockView.settingsChanged, object: nil)
        os_log("WoodClock 1.2 view init, preview: %d, presets: %d", log: wcLog, type: .default, isPreview ? 1 : 0, presets.count)
    }

    @objc private func screenSaverWillStop() {
        if !isPreview { stopAnimation() }
    }

    // MARK: - Settings

    func applySettings() {
        settings = Settings.load()
        switch settings.seconds {
        case .smooth: animationTimeInterval = 1.0 / 30.0
        case .tick:   animationTimeInterval = 1.0 / 10.0
        case .hidden: animationTimeInterval = 0.5
        }
        let preset = presets.first { $0.id == settings.presetID } ?? presets.first
        buildLayers(preset)
        layoutClock()
        lastSecond = -1
        updateHands(animateTick: false)
    }

    // MARK: - Layers

    private func buildLayers(_ preset: Preset?) {
        clock.sublayers?.forEach { $0.removeFromSuperlayer() }
        items.removeAll()
        guard let preset else { return }

        for spec in preset.layers {
            if settings.seconds == .hidden && spec.rotates == "second" { continue }
            if let shadow = spec.shadow {
                add(preset, file: shadow.file, spec: spec,
                    offset: CGPoint(x: shadow.offset[0], y: shadow.offset[1]))
            }
            add(preset, file: spec.file, spec: spec, offset: .zero)
        }
    }

    private func add(_ preset: Preset, file: String, spec: PresetLayer, offset: CGPoint) {
        let l = CALayer()
        l.contents = preset.image(file)
        l.contentsGravity = .resize
        l.minificationFilter = .trilinear      // исходники 1600 px, на экране меньше — без «лесенки»
        l.magnificationFilter = .linear
        clock.addSublayer(l)
        items.append(Item(layer: l, spec: spec, offset: offset, rotates: spec.rotates))
    }

    override func layout() {
        super.layout()
        layoutClock()
    }

    private func layoutClock() {
        let b = bounds
        let side = min(b.width, b.height) * CGFloat(isPreview ? 0.9 : settings.scale)
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        clock.frame = CGRect(x: b.midX - side / 2, y: b.midY - side / 2, width: side, height: side)
        for it in items {
            let t = it.layer.affineTransform()
            it.layer.setAffineTransform(.identity)
            it.layer.bounds = CGRect(x: 0, y: 0, width: it.spec.size[0] * side, height: it.spec.size[1] * side)
            it.layer.anchorPoint = CGPoint(x: it.spec.anchor[0], y: 1 - it.spec.anchor[1]) // слой y вверх
            it.layer.position = CGPoint(x: side / 2 + it.offset.x * side, y: side / 2 - it.offset.y * side)
            it.layer.setAffineTransform(t)
        }
        CATransaction.commit()
    }

    // MARK: - Time

    /// animateTick — в режиме «шагом» с дрожанием показать переход на новую секунду пружиной.
    private func updateHands(animateTick: Bool = false) {
        let c = Calendar.current.dateComponents([.hour, .minute, .second, .nanosecond], from: Date())
        let s = Double(c.second ?? 0)
        let frac = Double(c.nanosecond ?? 0) / 1e9
        let sec = settings.seconds == .smooth ? s + frac : s
        let minute = Double(c.minute ?? 0) + (s + frac) / 60
        let hour = Double((c.hour ?? 0) % 12) + minute / 60
        let degrees: [String: Double] = ["hour": hour * 30, "minute": minute * 6, "second": sec * 6]

        CATransaction.begin()
        CATransaction.setDisableActions(true)
        for it in items {
            guard let r = it.rotates, let deg = degrees[r] else { continue }
            // по часовой стрелке = отрицательный угол в системе координат с осью y вверх
            it.layer.setAffineTransform(CGAffineTransform(rotationAngle: -CGFloat(deg) * .pi / 180))
            if animateTick && r == "second" { addTickBounce(to: it.layer, degrees: deg) }
        }
        CATransaction.commit()
    }

    /// Затухающее дрожание секундной стрелки после шага: пружина от предыдущей отметки (−6°) к новой.
    /// Недодемпфированная (ζ ≈ 0.43): первый проскок ≈ 1.3°, дальше пара затухающих качаний за ~0.2 с.
    /// Анимацию крутит Core Animation с частотой экрана, таймер заставки при этом может оставаться редким.
    private func addTickBounce(to layer: CALayer, degrees deg: Double) {
        let spring = CASpringAnimation(keyPath: "transform.rotation.z")
        spring.mass = 1
        spring.stiffness = 3600      // ω ≈ 60 рад/с — около 10 качаний в секунду
        spring.damping = 52          // ζ = damping / (2·√(stiffness·mass)) ≈ 0.43 (при 30 размах был вдвое больше)
        spring.initialVelocity = 0
        spring.fromValue = -(deg - 6) * .pi / 180   // по часовой = отрицательный угол
        spring.toValue = -deg * .pi / 180
        spring.duration = spring.settlingDuration
        spring.isRemovedOnCompletion = true
        layer.add(spring, forKey: "tickBounce")
    }

    override func startAnimation() {
        super.startAnimation()
        updateHands()
    }

    override func animateOneFrame() {
        if settings.seconds == .smooth {
            updateHands()
            return
        }
        let s = Calendar.current.component(.second, from: Date())
        if s != lastSecond {
            // дрожание только на обычном шаге в одну секунду, не на первом кадре и не после пропуска
            let step = lastSecond >= 0 && (s - lastSecond + 60) % 60 == 1
            lastSecond = s
            updateHands(animateTick: settings.seconds == .tick && settings.bounce && step)
        }
    }

    override func draw(_ rect: NSRect) {
        NSColor.black.setFill()
        rect.fill()
    }

    // MARK: - Configure sheet

    override var hasConfigureSheet: Bool { true }

    override var configureSheet: NSWindow? {
        os_log("configureSheet requested (preview: %d)", log: wcLog, type: .default, isPreview ? 1 : 0)
        // Окно создаётся один раз и живёт вместе с view: если вернуть каждый раз новое,
        // а старое освободится, macOS 14+ может молча не показать sheet.
        if let sheet { sheet.load(); return sheet.window }
        if presets.isEmpty { presets = Preset.loadAll(bundle: Bundle(for: WoodClockView.self)) }
        let s = ConfigureSheet(presets: presets) {
            // В Sonoma+ превью и окно настроек могут жить в разных экземплярах view — оповещаем все.
            NotificationCenter.default.post(name: WoodClockView.settingsChanged, object: nil)
        }
        sheet = s
        return s.window
    }

    static let settingsChanged = Notification.Name("WoodClockSettingsChanged")

    @objc private func settingsDidChange() {
        applySettings()
    }
}
