//
//  AppDefaults.swift
//  Nightlight
//
//  Created by David Wu on 7/30/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import CoreLocation

final class AppDefaults {
    static var autoOnMode: AutoOnMode {
        get { return AutoOnMode(rawValue: groupDefaults.string(forDefault: .autoOnMode)!)! }
        set { groupDefaults.set(newValue.rawValue, forDefault: .autoOnMode) }
    }
    static var autoOnFromTime: Int {
        get { return groupDefaults.integer(forDefault: .autoOnFromTime) }
        set { groupDefaults.set(newValue, forDefault: .autoOnFromTime) }
    }
    static var autoOnToTime: Int {
        get { return groupDefaults.integer(forDefault: .autoOnToTime) }
        set { groupDefaults.set(newValue, forDefault: .autoOnToTime) }
    }
    static var autoOnLatitude: CLLocationDegrees? {
        get { return groupDefaults.doubleIfExists(forDefault: .autoOnLatitude) }
        set { groupDefaults.setOrRemove(newValue, forDefault: .autoOnLatitude) }
    }
    static var autoOnLongitude: CLLocationDegrees? {
        get { return groupDefaults.doubleIfExists(forDefault: .autoOnLongitude) }
        set { groupDefaults.setOrRemove(newValue, forDefault: .autoOnLongitude) }
    }
    private static let groupDefaults = UserDefaults(suiteName: "W6KLMFETUQ.net.gofake1.Nightlight")!
    
    static func registerDefaults() {
        groupDefaults.register(defaults: _defaults)
    }
}

extension UserDefaults {
    fileprivate func set(_ value: Any?, forDefault default: AppDefaultKind) {
        set(value, forKey: `default`.rawValue)
    }
    
    fileprivate func set(_ value: Int, forDefault default: AppDefaultKind) {
        set(value, forKey: `default`.rawValue)
    }
    
    fileprivate func setOrRemove(_ value: Double?, forDefault default: AppDefaultKind) {
        if let value = value {
            set(value, forKey: `default`.rawValue)
        } else {
            removeObject(forKey: `default`.rawValue)
        }
    }
}
