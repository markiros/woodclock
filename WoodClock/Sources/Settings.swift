import ScreenSaver

enum SecondsMode: Int {
    case smooth = 0   // плавный ход
    case tick = 1     // шаг раз в секунду
    case hidden = 2   // без секундной стрелки
}

struct Settings {
    var presetID: String
    var seconds: SecondsMode
    var bounce: Bool           // в режиме «шагом»: стрелка проскакивает отметку и затухающе качается
    var scale: Double          // диаметр часов как доля от меньшей стороны экрана

    static let defaultPreset = "walnut"

    private static var store: UserDefaults {
        let id = Bundle(for: WoodClockView.self).bundleIdentifier ?? "com.mark.WoodClock"
        return ScreenSaverDefaults(forModuleWithName: id) ?? .standard
    }

    static func load() -> Settings {
        let d = store
        d.register(defaults: ["preset": defaultPreset, "seconds": SecondsMode.smooth.rawValue, "bounce": false, "scale": 0.7])
        return Settings(
            presetID: d.string(forKey: "preset") ?? defaultPreset,
            seconds: SecondsMode(rawValue: d.integer(forKey: "seconds")) ?? .smooth,
            bounce: d.bool(forKey: "bounce"),
            scale: min(max(d.double(forKey: "scale"), 0.3), 0.95)
        )
    }

    func save() {
        let d = Settings.store
        d.set(presetID, forKey: "preset")
        d.set(seconds.rawValue, forKey: "seconds")
        d.set(bounce, forKey: "bounce")
        d.set(scale, forKey: "scale")
        d.synchronize()
    }
}

/// Мини-локализация: русский, если он первый в системных языках, иначе английский.
enum L {
    static let isRussian = Locale.preferredLanguages.first?.hasPrefix("ru") ?? false
    static func t(_ ru: String, _ en: String) -> String { isRussian ? ru : en }
}
