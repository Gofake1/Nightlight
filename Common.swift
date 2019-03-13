//
//  Basic.swift
//  Nightlight
//
//  Created by David Wu on 7/30/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import struct CoreLocation.CLLocationCoordinate2D
import Foundation

let _defaults: [String: Any] = [
    AppDefaultKind.autoOnMode.rawValue:       AutoOnMode.manual.rawValue,
    AppDefaultKind.autoOnFromTime.rawValue:   72000,
    AppDefaultKind.autoOnToTime.rawValue:     28800
]
let _notificationEmptyCache = NSNotification.Name("emptyCache")
let _nightlight = "net.gofake1.Nightlight"

enum AutoOnMode: String {
    case manual
    case custom
    case sunset
    case system
}

enum AppDefaultKind: String {
    case autoOnMode
    case autoOnFromTime
    case autoOnToTime
    case autoOnLatitude
    case autoOnLongitude
    case isOn
}

extension CLLocationCoordinate2D {
    func makeDatesForLabel() -> (from: Date, to: Date)? {
        let now = Date()
        guard let sol = Solar(for: now, coordinate: self), let sunrise = sol.sunrise, let sunset = sol.sunset
            else { return nil }
        let yesterday = Calendar.autoupdatingCurrent.date(byAdding: .day, value: -1, to: now)!
        let tomorrow = Calendar.autoupdatingCurrent.date(byAdding: .day, value: 1, to: now)!
        if now < sunrise {
            guard let sol = Solar(for: yesterday, coordinate: self), let prevSunset = sol.sunset else { return nil }
            return (prevSunset, sunrise)
        } else {
            guard let sol = Solar(for: tomorrow, coordinate: self), let nextSunrise = sol.sunrise else { return nil }
            return (sunset, nextSunrise)
        }
    }
}

extension UserDefaults {
    func doubleIfExists(forDefault default: AppDefaultKind) -> Double? {
        if let _ = object(forKey: `default`.rawValue) {
            return double(forKey: `default`.rawValue)
        } else {
            return nil
        }
    }
    
    func integer(forDefault default: AppDefaultKind) -> Int {
        return integer(forKey: `default`.rawValue)
    }
    
    func string(forDefault default: AppDefaultKind) -> String? {
        return string(forKey: `default`.rawValue)
    }
}
