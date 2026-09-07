import Foundation

enum Formatters {
    static func quantity(_ value: Double, unit: MeasurementUnit) -> String {
        let numberString: String
        if unit.isWholeNumber {
            numberString = String(Int(value.rounded()))
        } else {
            numberString = value.truncatingRemainder(dividingBy: 1) == 0
                ? String(Int(value))
                : String(format: "%.1f", value)
        }
        return "\(numberString) \(unit.shortLabel)"
    }

    static func daysRemainingLabel(_ days: Int) -> String {
        if days < 0 {
            let overdue = abs(days)
            return overdue == 1 ? "Expired 1 day ago" : "Expired \(overdue) days ago"
        } else if days == 0 {
            return "Expires today"
        } else if days == 1 {
            return "Expires tomorrow"
        } else {
            return "Expires in \(days) days"
        }
    }

    static func shortDate(_ date: Date) -> String {
        date.formatted(date: .abbreviated, time: .omitted)
    }

    static func time(_ date: Date) -> String {
        date.formatted(date: .omitted, time: .shortened)
    }

    static func relativeDay(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            return date.formatted(.dateTime.weekday(.wide).day().month(.abbreviated))
        }
    }
}
