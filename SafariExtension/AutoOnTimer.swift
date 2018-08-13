//
//  AutoOnTimer.swift
//  SafariExtension
//
//  Created by David Wu on 8/10/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import CoreLocation

final class CustomTimer: NSObject {
    private var onTimer = Timer()
    private var offTimer = Timer()
    
    override init() {
        super.init()
        onTimer = makeTimer(minutes: AppDefaults.autoOnFromTime) { AppDefaults.isOn = true }
        offTimer = makeTimer(minutes: AppDefaults.autoOnToTime) { AppDefaults.isOn = false }
        RunLoop.main.add(onTimer, forMode: .common)
        RunLoop.main.add(offTimer, forMode: .common)
        AppDefaults.addObserver(self, forDefaults: [.autoOnFromTime, .autoOnToTime])
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        switch AppDefaultKind(rawValue: keyPath!)! {
        case .autoOnFromTime:
            onTimer.invalidate()
            onTimer = makeTimer(minutes: change![.newKey]! as! Int) { AppDefaults.isOn = true }
            RunLoop.main.add(onTimer, forMode: .common)
        case .autoOnToTime:
            offTimer.invalidate()
            offTimer = makeTimer(minutes: change![.newKey]! as! Int) { AppDefaults.isOn = false }
            RunLoop.main.add(offTimer, forMode: .common)
        default:
            fatalError()
        }
    }
    
    private func makeTimer(minutes: Int, block: @escaping () -> ()) -> Timer {
        let date = DateComponents(minute: minutes).nextDateWithTime()
        return Timer(fire: date, interval: 86400, repeats: true) { _ in block() }
    }
    
    deinit {
        onTimer.invalidate()
        offTimer.invalidate()
    }
}

final class SunsetTimer: NSObject {
    private var onTimer = Timer()
    private var offTimer = Timer()
    
    override init() {
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
        onTimer.invalidate()
        offTimer.invalidate()
        
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
        
        (onTimer, offTimer) = makeTimers(sunset: sunset, sunrise: sunrise, coordinate: coordinate)
        RunLoop.main.add(onTimer, forMode: .common)
        RunLoop.main.add(offTimer, forMode: .common)
    }
    
    private func makeTimers(sunset: Date, sunrise: Date, coordinate: CLLocationCoordinate2D) -> (Timer, Timer) {
        return (Timer(fire: sunset, interval: 0, repeats: true, block: {
            AppDefaults.isOn = true
            $0.fireDate = coordinate.makeSolarDates()!.sunset
        }), Timer(fire: sunrise, interval: 0, repeats: true, block: {
            AppDefaults.isOn = false
            $0.fireDate = coordinate.makeSolarDates()!.sunrise
        }))
    }
    
    deinit {
        onTimer.invalidate()
        offTimer.invalidate()
    }
}

extension DateComponents {
    fileprivate func nextDateWithTime() -> Date {
        let elapsed = (hour! * 60) + minute!
        let now = Calendar.current.dateComponents([.hour, .minute], from: Date())
        let elapsedToday = (now.hour! * 60) + minute!
        if elapsed < elapsedToday {
            return DateComponents(day: day!+1).date!
        } else {
            return date!
        }
    }
}
