import AppKit
import os.log

let wcLog = OSLog(subsystem: "com.mark.WoodClock", category: "saver")

/// Окно параметров: выбор пресета с превью, режим секундной стрелки, размер часов.
/// Вёрстка на фреймах, без Auto Layout: на macOS 14+ legacyScreenSaver молча не показывает
/// sheet, если у окна нулевой/неопределённый размер контента или при его сборке было исключение.
final class ConfigureSheet: NSObject {
    let window: NSWindow

    private let presets: [Preset]
    private let onSave: () -> Void

    private let popup = NSPopUpButton(frame: .zero, pullsDown: false)
    private let preview = NSImageView(frame: .zero)
    private let seconds = NSSegmentedControl(frame: .zero)
    private let bounce = NSButton(checkboxWithTitle: L.t("Дрожание при шаге", "Bounce on tick"), target: nil, action: nil)
    private let sizeSlider = NSSlider(frame: .zero)
    private let sizeLabel = NSTextField(labelWithString: "")

    private static let W: CGFloat = 460
    private static let H: CGFloat = 456

    init(presets: [Preset], onSave: @escaping () -> Void) {
        self.presets = presets
        self.onSave = onSave
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: Self.W, height: Self.H),
                          styleMask: [.titled],
                          backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        super.init()
        build()
        load()
        os_log("configure sheet built, presets: %d", log: wcLog, type: .default, presets.count)
    }

    private func build() {
        window.title = L.t("Деревянные часы", "Wood Clock")
        let content = NSView(frame: NSRect(x: 0, y: 0, width: Self.W, height: Self.H))
        window.contentView = content

        let labelX: CGFloat = 20, labelW: CGFloat = 150, ctlX: CGFloat = 180
        var y = Self.H - 44   // идём сверху вниз (у AppKit y растёт вверх)

        // Циферблат
        content.addSubview(label(L.t("Циферблат:", "Dial:"), NSRect(x: labelX, y: y + 3, width: labelW, height: 17)))
        popup.frame = NSRect(x: ctlX - 3, y: y - 2, width: 240, height: 26)
        presets.forEach { popup.addItem(withTitle: $0.displayName) }
        if presets.isEmpty { popup.addItem(withTitle: L.t("Пресеты не найдены", "No presets found")) }
        popup.target = self
        popup.action = #selector(presetChanged)
        content.addSubview(popup)

        // Превью
        y -= 210
        preview.frame = NSRect(x: ctlX, y: y, width: 200, height: 200)
        preview.imageScaling = .scaleProportionallyUpOrDown
        preview.wantsLayer = true
        preview.layer?.backgroundColor = NSColor.black.cgColor
        preview.layer?.cornerRadius = 10
        preview.layer?.masksToBounds = true
        content.addSubview(preview)

        // Секундная стрелка
        y -= 40
        content.addSubview(label(L.t("Секундная стрелка:", "Second hand:"), NSRect(x: labelX, y: y + 3, width: labelW, height: 17)))
        seconds.segmentCount = 3
        seconds.trackingMode = .selectOne
        let segs = [L.t("Плавно", "Smooth"), L.t("Шагом", "Tick"), L.t("Скрыть", "Hidden")]
        for (i, s) in segs.enumerated() {
            seconds.setLabel(s, forSegment: i)
            seconds.setWidth(78, forSegment: i)
        }
        seconds.frame = NSRect(x: ctlX, y: y - 1, width: 250, height: 24)
        seconds.target = self
        seconds.action = #selector(secondsChanged)
        content.addSubview(seconds)

        // Дрожание секундной стрелки (только для «Шагом»)
        y -= 26
        bounce.frame = NSRect(x: ctlX, y: y, width: 260, height: 18)
        bounce.toolTip = L.t("На каждом шаге стрелка проскакивает отметку и затухающе качается, как у кварцевых часов",
                             "On each tick the hand overshoots the mark and settles with a damped wobble, like a quartz clock")
        content.addSubview(bounce)

        // Размер
        y -= 36
        content.addSubview(label(L.t("Размер:", "Size:"), NSRect(x: labelX, y: y + 3, width: labelW, height: 17)))
        sizeSlider.minValue = 0.4
        sizeSlider.maxValue = 0.95
        sizeSlider.target = self
        sizeSlider.action = #selector(sizeChanged)
        sizeSlider.frame = NSRect(x: ctlX, y: y, width: 200, height: 22)
        content.addSubview(sizeSlider)
        sizeLabel.frame = NSRect(x: ctlX + 208, y: y + 3, width: 60, height: 17)
        sizeLabel.font = .monospacedDigitSystemFont(ofSize: NSFont.systemFontSize, weight: .regular)
        content.addSubview(sizeLabel)

        // Кнопки
        let ok = NSButton(title: "OK", target: self, action: #selector(okPressed))
        ok.bezelStyle = .rounded
        ok.keyEquivalent = "\r"
        ok.frame = NSRect(x: Self.W - 20 - 90, y: 16, width: 90, height: 32)
        let cancel = NSButton(title: L.t("Отмена", "Cancel"), target: self, action: #selector(cancelPressed))
        cancel.bezelStyle = .rounded
        cancel.keyEquivalent = "\u{1b}"
        cancel.frame = NSRect(x: Self.W - 20 - 90 - 10 - 100, y: 16, width: 100, height: 32)
        content.addSubview(cancel)
        content.addSubview(ok)
    }

    private func label(_ s: String, _ frame: NSRect) -> NSTextField {
        let f = NSTextField(labelWithString: s)
        f.alignment = .right
        f.frame = frame
        return f
    }

    func load() {
        let s = Settings.load()
        if let i = presets.firstIndex(where: { $0.id == s.presetID }) { popup.selectItem(at: i) }
        seconds.selectedSegment = s.seconds.rawValue
        bounce.state = s.bounce ? .on : .off
        secondsChanged()
        sizeSlider.doubleValue = s.scale
        presetChanged()
        sizeChanged()
    }

    @objc private func presetChanged() {
        updatePreview()
    }

    @objc private func secondsChanged() {
        bounce.isEnabled = seconds.selectedSegment == SecondsMode.tick.rawValue
        updatePreview()
    }

    private func updatePreview() {
        let i = popup.indexOfSelectedItem
        guard presets.indices.contains(i) else { preview.image = nil; return }
        let p = presets[i]
        preview.image = p.composedPreview(showSecond: seconds.selectedSegment != SecondsMode.hidden.rawValue) ?? p.preview
    }

    @objc private func sizeChanged() {
        sizeLabel.stringValue = "\(Int((sizeSlider.doubleValue * 100).rounded())) %"
    }

    @objc private func okPressed() {
        var s = Settings.load()
        let i = popup.indexOfSelectedItem
        if presets.indices.contains(i) { s.presetID = presets[i].id }
        s.seconds = SecondsMode(rawValue: seconds.selectedSegment) ?? .smooth
        s.bounce = bounce.state == .on
        s.scale = sizeSlider.doubleValue
        s.save()
        os_log("settings saved: %{public}@", log: wcLog, type: .default, s.presetID)
        onSave()
        close()
    }

    @objc private func cancelPressed() {
        os_log("settings cancelled", log: wcLog, type: .default)
        close()
    }

    private func close() {
        if let parent = window.sheetParent {
            parent.endSheet(window)
        } else {
            NSApp.endSheet(window)
            window.orderOut(nil)
        }
    }
}
