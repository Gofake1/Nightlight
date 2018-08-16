//
//  AutoOnTimer.swift
//  SafariExtension
//
//  Created by David Wu on 8/10/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import CoreLocation

final class AutoOnTimer: NSObject {
    static let shared = AutoOnTimer()
    private var timer = AppDefaults.autoOnMode.makeTimer()
    
    private override init() {
        super.init()
        AppDefaults.addObserver(self, forDefaults: [.autoOnMode])
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        switch AppDefaultKind(rawValue: keyPath!)! {
        case .autoOnMode:
            timer = AutoOnMode(rawValue: change![.newKey]! as! String)!.makeTimer()
        default:
            fatalError()
        }
    }
    
    deinit {
        AppDefaults.removeObserver(self, forDefaults: [.autoOnMode])
    }
}

final class CustomTimer: NSObject {
    private var onTimer = Timer()
    private var offTimer = Timer()
    
    fileprivate override init() {
        super.init()
        onTimer = makeTimer(seconds: AppDefaults.autoOnFromTime) { AppDefaults.isOn = true }
        offTimer = makeTimer(seconds: AppDefaults.autoOnToTime) { AppDefaults.isOn = false }
        RunLoop.main.add(onTimer, forMode: .common)
        RunLoop.main.add(offTimer, forMode: .common)
        AppDefaults.addObserver(self, forDefaults: [.autoOnFromTime, .autoOnToTime])
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        switch AppDefaultKind(rawValue: keyPath!)! {
        case .autoOnFromTime:
            NSLog("from time changed: \(change![.newKey]!)") //*
            onTimer.invalidate()
            onTimer = makeTimer(seconds: change![.newKey]! as! Int) { AppDefaults.isOn = true }
            RunLoop.main.add(onTimer, forMode: .common)
        case .autoOnToTime:
            NSLog("to time changed: \(change![.newKey]!)") //*
            offTimer.invalidate()
            offTimer = makeTimer(seconds: change![.newKey]! as! Int) { AppDefaults.isOn = false }
            RunLoop.main.add(offTimer, forMode: .common)
        default:
            fatalError()
        }
    }
    
    private func makeTimer(seconds: Int, block: @escaping () -> ()) -> Timer {
        let date = Calendar.autoupdatingCurrent.date(timeInSeconds: seconds)!
        NSLog("timer for \(date)") //*
        return Timer(fire: date, interval: 86400, repeats: true) { _ in block() }
    }
    
    deinit {
        onTimer.invalidate()
        offTimer.invalidate()
        AppDefaults.removeObserver(self, forDefaults: [.autoOnFromTime, .autoOnToTime])
    }
}

final class SunsetTimer: NSObject {
    private var onTimer = Timer()
    private var offTimer = Timer()
    
    fileprivate override init() {
        super.init()
        if let latitude = AppDefaults.autoOnLatitude, let longitude = AppDefaults.autoOnLongitude {
            let coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            if let (sunset, sunrise) = coordinate.makeSolarDates() {
                (onTimer, offTimer) = makeTimers(sunset: sunset, sunrise: sunrise, coordinate: coordinate)
                RunLoop.main.add(onTimer, forMode: .common)
                RunLoop.main.add(offTimer, forMode: .common)
            }
        }
        AppDefaults.addObserver(self, forDefaults: [.autoOnLatitude, .autoOnLongitude])
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        guard let coordinate = {
            switch AppDefaultKind(rawValue: keyPath!)! {
            case .autoOnLatitude:
                guard let latitude = change![.newKey], let longitude = AppDefaults.autoOnLongitude else { return nil }
                return CLLocationCoordinate2D(latitude: latitude as! CLLocationDegrees, longitude: longitude)
            case .autoOnLongitude:
                guard let latitude = AppDefaults.autoOnLatitude, let longitude = change![.newKey] else { return nil }
                return CLLocationCoordinate2D(latitude: latitude, longitude: longitude as! CLLocationDegrees)
            default:
                fatalError()
            }
            }() as CLLocationCoordinate2D?,
            let (sunset, sunrise) = coordinate.makeSolarDates()
            else { return }
        
        onTimer.invalidate()
        offTimer.invalidate()
        (onTimer, offTimer) = makeTimers(sunset: sunset, sunrise: sunrise, coordinate: coordinate)
        RunLoop.main.add(onTimer, forMode: .common)
        RunLoop.main.add(offTimer, forMode: .common)
    }
    
    private func makeTimers(sunset: Date, sunrise: Date, coordinate: CLLocationCoordinate2D) -> (Timer, Timer) {
        NSLog("making timers for sunset (\(sunset)) and sunrise (\(sunrise))") //*
        return (Timer(fire: sunset, interval: 86400, repeats: true, block: { [weak self] in
            AppDefaults.isOn = true
            $0.fireDate = coordinate.makeSolarDates()!.sunset
            NSLog("sunset \($0.fireDate)") //*
            SafariExtensionViewController.shared.updateSunsetAutoOnLabel(sunset: $0.fireDate,
                                                                         sunrise: self!.offTimer.fireDate)
        }), Timer(fire: sunrise, interval: 86400, repeats: true, block: { [weak self] in
            AppDefaults.isOn = false
            $0.fireDate = coordinate.makeSolarDates()!.sunrise
            NSLog("sunrise \($0.fireDate)") //*
            SafariExtensionViewController.shared.updateSunsetAutoOnLabel(sunset: self!.onTimer.fireDate,
                                                                         sunrise: $0.fireDate)
        }))
    }
    
    deinit {
        onTimer.invalidate()
        offTimer.invalidate()
        AppDefaults.removeObserver(self, forDefaults: [.autoOnLatitude, .autoOnLongitude])
    }
}

extension AutoOnMode {
    fileprivate func makeTimer() -> NSObject? {
        switch self {
        case .manual:   return nil
        case .custom:   return CustomTimer()
        case .sunset:   return SunsetTimer()
        }
    }
}
