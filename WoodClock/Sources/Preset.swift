import AppKit
import ImageIO

/// Описание одного слоя из preset.json.
/// size — доля от холста циферблата, anchor — ось вращения в долях картинки от левого верхнего угла.
struct PresetLayer: Decodable {
    struct Shadow: Decodable {
        let file: String
        let offset: [CGFloat]   // смещение тени (x вправо, y вниз) в долях холста
    }
    let name: String
    let file: String
    let size: [CGFloat]
    let anchor: [CGFloat]
    let shadow: Shadow?
    let rotates: String?        // "hour" | "minute" | "second" | nil
}

struct Preset: Decodable {
    let id: String
    let name: String
    let nameEn: String?
    let canvas: CGFloat
    let layers: [PresetLayer]
    var directory = URL(fileURLWithPath: "/")

    private enum CodingKeys: String, CodingKey { case id, name, nameEn, canvas, layers }

    var displayName: String { L.isRussian ? name : (nameEn ?? name) }

    var preview: NSImage? { NSImage(contentsOf: directory.appendingPathComponent("preview.png")) }

    /// Превью для окна настроек, собранное из слоёв в позе preview.png (render.py: 304°, 48°, 150°).
    /// Без секундной стрелки и её тени, если showSecond == false.
    func composedPreview(side: CGFloat = 400, showSecond: Bool) -> NSImage? {
        let angles: [String: CGFloat] = ["hour": 304, "minute": 48, "second": 150]
        let px = Int(side)
        guard let ctx = CGContext(data: nil, width: px, height: px, bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.interpolationQuality = .high
        func draw(_ file: String, _ spec: PresetLayer, offset: CGPoint) {
            guard let cg = image(file) else { return }
            let w = spec.size[0] * side, h = spec.size[1] * side
            ctx.saveGState()
            // ось вращения в центре холста (+ сдвиг тени); y вверх, поэтому по часовой — отрицательный угол
            ctx.translateBy(x: side / 2 + offset.x * side, y: side / 2 - offset.y * side)
            if let r = spec.rotates, let a = angles[r] { ctx.rotate(by: -a * .pi / 180) }
            ctx.draw(cg, in: CGRect(x: -spec.anchor[0] * w, y: -(1 - spec.anchor[1]) * h, width: w, height: h))
            ctx.restoreGState()
        }
        for spec in layers {
            if !showSecond && spec.rotates == "second" { continue }
            if let sh = spec.shadow { draw(sh.file, spec, offset: CGPoint(x: sh.offset[0], y: sh.offset[1])) }
            draw(spec.file, spec, offset: .zero)
        }
        return ctx.makeImage().map { NSImage(cgImage: $0, size: NSSize(width: side, height: side)) }
    }

    func image(_ file: String) -> CGImage? {
        let url = directory.appendingPathComponent(file) as CFURL
        guard let src = CGImageSourceCreateWithURL(url, nil) else { return nil }
        return CGImageSourceCreateImageAtIndex(src, 0, nil)
    }

    /// Все пресеты из Resources/Presets/<id>/preset.json. Новый пресет = новая папка, код менять не нужно.
    static func loadAll(bundle: Bundle) -> [Preset] {
        guard let root = bundle.resourceURL?.appendingPathComponent("Presets"),
              let dirs = try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)
        else { return [] }
        let order = ["walnut", "marquetry", "maple", "ebony", "station", "ivory", "lacquer", "mahogany", "filigree", "neon", "neon_dots"]
        let rank = { (p: Preset) in order.firstIndex(of: p.id) ?? order.count }
        return dirs.compactMap { dir -> Preset? in
            guard let data = try? Data(contentsOf: dir.appendingPathComponent("preset.json")),
                  var preset = try? JSONDecoder().decode(Preset.self, from: data) else { return nil }
            preset.directory = dir
            return preset
        }
        .sorted { (rank($0), $0.name) < (rank($1), $1.name) }
    }
}
