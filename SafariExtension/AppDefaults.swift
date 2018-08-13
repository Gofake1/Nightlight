//
//  AppDefaults.swift
//  SafariExtension
//
//  Created by David Wu on 8/5/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import CoreLocation

final class AppDefaults {
    static var autoOnMode: AutoOnMode {
        return AutoOnMode(rawValue: groupDefaults.string(forDefault: .autoOnMode)!)!
    }
    static var autoOnFromTime: Int {
        return groupDefaults.integer(forDefault: .autoOnFromTime)
    }
    static var autoOnToTime: Int {
        return groupDefaults.integer(forDefault: .autoOnToTime)
    }
    static var autoOnLatitude: CLLocationDegrees? {
        return groupDefaults.doubleIfExists(forDefault: .autoOnLatitude)
    }
    static var autoOnLongitude: CLLocationDegrees? {
        return groupDefaults.doubleIfExists(forDefault: .autoOnLongitude)
    }
    static var isOn: Bool {
        get { return groupDefaults.bool(forDefault: .isOn) }
        set { groupDefaults.set(newValue, forDefault: .isOn) }
    }
    private static let groupDefaults = UserDefaults(suiteName: "W6KLMFETUQ.net.gofake1.Nightlight")!
    
    static func addObserver(_ object: NSObject, forDefaults defaults: Set<AppDefaultKind>) {
        for `default` in defaults {
            groupDefaults.addObserver(object, forKeyPath: `default`.rawValue, options: .new, context: nil)
        }
    }
}

extension UserDefaults {
    fileprivate func bool(forDefault default: AppDefaultKind) -> Bool {
        return bool(forKey: `default`.rawValue)
    }
    
    fileprivate func set(_ value: Bool, forDefault default: AppDefaultKind) {
        set(value, forKey: `default`.rawValue)
    }
}
