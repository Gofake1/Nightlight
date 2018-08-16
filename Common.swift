//
//  Basic.swift
//  Nightlight
//
//  Created by David Wu on 7/30/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import CoreLocation

enum AutoOnMode: String {
    case manual
    case custom
    case sunset
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
    func makeSolarDates() -> (sunset: Date, sunrise: Date)? {
        let solar = Solar(coordinate: self)
        if let solar = solar, var sunset = solar.sunset, var sunrise = solar.sunrise {
            let now = Date()
            if sunset < now {
                sunset = Calendar.autoupdatingCurrent.date(byAdding: .day, value: 1, to: sunset)!
            }
            if sunrise < now {
                sunrise = Calendar.autoupdatingCurrent.date(byAdding: .day, value: 1, to: sunrise)!
            }
            return (sunset, sunrise)
        } else {
            return nil
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
