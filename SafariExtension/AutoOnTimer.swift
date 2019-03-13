//
//  AutoOnTimer.swift
//  SafariExtension
//
//  Created by David Wu on 8/10/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import var AppKit.NSApp
import class AppKit.NSWorkspace
import struct CoreLocation.CLLocationCoordinate2D
import typealias CoreLocation.CLLocationDegrees
import Foundation

private let _df: DateFormatter = {
    let df = DateFormatter()
    df.dateStyle = .short
    df.timeStyle = .short
    return df
}()

final class AutoOn: NSObject {
    static let shared = AutoOn()
    private var impl: NSObject?
    
    private override init() {
        super.init()
        AppDefaults.registerDefaults()
        impl = AppDefaults.autoOnMode.makeImpl()
        AppDefaults.addObserver(self, forDefaults: [.autoOnMode])
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        switch AppDefaultKind(rawValue: keyPath!)! {
        case .autoOnMode:
            impl = AutoOnMode(rawValue: change![.newKey]! as! String)!.makeImpl()
        default:
            fatalError()
        }
    }
    
    deinit {
        AppDefaults.removeObserver(self, forDefaults: [.autoOnMode])
    }
}

private final class CustomTimeImpl: NSObject {
    private var timers = Set<Timer>()
    
    override init() {
        super.init()
        timers = makeTimers()
        RunLoop.main.add(timers)
        AppDefaults.addObserver(self, forDefaults: [.autoOnFromTime, .autoOnToTime])
        NotificationCenter.default.addObserver(self, selector: #selector(systemClockDidChange(_:)),
                                               name: .NSSystemClockDidChange, object: nil)
        NSWorkspace.shared.notificationCenter.addObserver(self, selector: #selector(workspaceDidWake(_:)),
                                                          name: NSWorkspace.didWakeNotification, object: nil)
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        let kind = AppDefaultKind(rawValue: keyPath!)!
        assert(kind == .autoOnFromTime || kind == .autoOnToTime)
        timers.forEach { $0.invalidate() }
        timers = makeTimers()
        RunLoop.main.add(timers)
    }
    
    private func makeDates(using date: Date = Date()) -> (Date, Date) {
        let cal = Calendar.autoupdatingCurrent
        let next = cal.date(byAdding: .day, value: 1, to: date)!
        let onDate = cal.date(timeInSeconds: AppDefaults.autoOnFromTime, using: date)!
        let offDate = cal.date(timeInSeconds: AppDefaults.autoOnToTime, using: date)!
        let onDateNext = cal.date(timeInSeconds: AppDefaults.autoOnFromTime, using: next)!
        let offDateNext = cal.date(timeInSeconds: AppDefaults.autoOnToTime, using: next)!
        return (date < onDate ? onDate : onDateNext, date < offDate ? offDate : offDateNext)
    }
    
    private func makeTimers(using date: Date = Date()) -> Set<Timer> {
        let (onDate, offDate) = makeDates(using: date)
        NSLog("onTimer scheduled for \(_df.string(from: onDate))") //*
        NSLog("offTimer scheduled for \(_df.string(from: offDate))") //*
        return [
            Timer(fireAt: onDate, interval: 0, target: self, selector: #selector(onTimerFired(_:)), userInfo: nil,
                  repeats: false),
            Timer(fireAt: offDate, interval: 0, target: self, selector: #selector(offTimerFired(_:)), userInfo: nil,
                  repeats: false)
        ]
    }
    
    private func isOn(_ date: Date) -> Bool {
        let cal = Calendar.autoupdatingCurrent
        let onDate = cal.date(timeInSeconds: AppDefaults.autoOnFromTime, using: date)!
        let offDate = cal.date(timeInSeconds: AppDefaults.autoOnToTime, using: date)!
        return date < offDate || date > onDate
    }
    
    private func reset() {
        let now = Date()
        timers.forEach { $0.invalidate() }
        timers = makeTimers(using: now)
        RunLoop.main.add(timers)
        AppDefaults.isOn = isOn(now)
    }
    
    @objc private func onTimerFired(_ timer: Timer) {
        NSLog("onTimerFired") //*
        AppDefaults.isOn = true
        timers.remove(timer)
        let (onDate, _) = makeDates()
        let onTimer = Timer(fireAt: onDate, interval: 0, target: self, selector: #selector(onTimerFired(_:)),
                            userInfo: nil, repeats: false)
        timers.insert(onTimer)
        RunLoop.main.add(onTimer, forMode: .common)
    }
    
    @objc private func offTimerFired(_ timer: Timer) {
        NSLog("offTimerFired") //*
        AppDefaults.isOn = false
        timers.remove(timer)
        let (_, offDate) = makeDates()
        let offTimer = Timer(fireAt: offDate, interval: 0, target: self, selector: #selector(offTimerFired(_:)),
                             userInfo: nil, repeats: false)
        timers.insert(offTimer)
        RunLoop.main.add(offTimer, forMode: .common)
    }
    
    @objc private func systemClockDidChange(_ notification: Notification) {
        NSLog("systemClockDidChange") //*
        DispatchQueue.main.async { [weak self] in self?.reset() }
    }
    
    @objc private func workspaceDidWake(_ notification: Notification) {
        NSLog("workspaceDidWake") //*
        DispatchQueue.main.async { [weak self] in self?.reset() }
    }
    
    deinit {
        timers.forEach { $0.invalidate() }
        AppDefaults.removeObserver(self, forDefaults: [.autoOnFromTime, .autoOnToTime])
        NotificationCenter.default.removeObserver(self)
        NSWorkspace.shared.notificationCenter.removeObserver(self)
    }
}

private final class SunsetTimeImpl: NSObject {
    private var coordinate: CLLocationCoordinate2D
    private var timers = Set<Timer>()
    
    override init() {
        coordinate = CLLocationCoordinate2D(latitude: AppDefaults.autoOnLatitude!,
                                            longitude: AppDefaults.autoOnLongitude!)
        super.init()
        timers = makeTimers()
        RunLoop.main.add(timers)
        AppDefaults.addObserver(self, forDefaults: [.autoOnLatitude, .autoOnLongitude])
        NotificationCenter.default.addObserver(self, selector: #selector(systemClockDidChange(_:)),
                                               name: .NSSystemClockDidChange, object: nil)
        NSWorkspace.shared.notificationCenter.addObserver(self, selector: #selector(workspaceDidWake(_:)),
                                                          name: NSWorkspace.didWakeNotification, object: nil)
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        let kind = AppDefaultKind(rawValue: keyPath!)!
        assert(kind == .autoOnLatitude || kind == .autoOnLongitude)
        timers.forEach { $0.invalidate() }
        guard let latitude = AppDefaults.autoOnLatitude, let longitude = AppDefaults.autoOnLongitude else { return }
        coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        timers = makeTimers()
        RunLoop.main.add(timers)
    }
    
    private func makeDates(using date: Date = Date()) -> (Date, Date)? {
        guard let sol = Solar(for: date, coordinate: coordinate), let sunrise = sol.sunrise,
            let sunset = sol.sunset else { return nil }
        if date < sunrise {
            return (sunset, sunrise)
        }
        let next = Calendar.autoupdatingCurrent.date(byAdding: .day, value: 1, to: date)!
        guard let nextSol = Solar(for: next, coordinate: coordinate), let nextSunrise = nextSol.sunrise,
            let nextSunset = nextSol.sunset else { return nil }
        if date >= sunrise && date < sunset {
            return (sunset, nextSunrise)
        } else {
            return (nextSunset, nextSunrise)
        }
    }
    
    private func makeTimers(using date: Date = Date()) -> Set<Timer> {
        guard let (onDate, offDate) = makeDates(using: date) else { return [] }
        NSLog("onTimer scheduled for \(_df.string(from: onDate))") //*
        NSLog("offTimer scheduled for \(_df.string(from: offDate))") //*
        return [
            Timer(fireAt: onDate, interval: 0, target: self, selector: #selector(onTimerFired(_:)),
                  userInfo: nil, repeats: false),
            Timer(fireAt: offDate, interval: 0, target: self, selector: #selector(offTimerFired(_:)),
                  userInfo: nil, repeats: false)
        ]
    }
    
    private func isOn(_ date: Date) -> Bool? {
        guard let sol = Solar(for: date, coordinate: coordinate), let sunrise = sol.sunrise,
            let sunset = sol.sunset else { return nil }
        return date < sunrise || date > sunset
    }
    
    private func reset() {
        let now = Date()
        timers.forEach { $0.invalidate() }
        timers = makeTimers(using: now)
        RunLoop.main.add(timers)
        if let isOn = isOn(now) {
            AppDefaults.isOn = isOn
        }
    }
    
    @objc private func onTimerFired(_ timer: Timer) {
        NSLog("onTimerFired") //*
        AppDefaults.isOn = true
        timers.remove(timer)
        guard let (onDate, _) = makeDates() else { return }
        NSLog("onTimer scheduled for \(_df.string(from: onDate))") //*
        let onTimer = Timer(fireAt: onDate, interval: 0, target: self, selector: #selector(onTimerFired(_:)),
                            userInfo: nil, repeats: false)
        timers.insert(onTimer)
        RunLoop.main.add(onTimer, forMode: .common)
    }
    
    @objc private func offTimerFired(_ timer: Timer) {
        NSLog("offTimerFired") //*
        AppDefaults.isOn = false
        timers.remove(timer)
        guard let (_, offDate) = makeDates() else { return }
        NSLog("offTimer scheduled for \(_df.string(from: offDate))") //*
        let offTimer = Timer(fireAt: offDate, interval: 0, target: self, selector: #selector(offTimerFired(_:)),
                             userInfo: nil, repeats: false)
        timers.insert(offTimer)
        RunLoop.main.add(offTimer, forMode: .common)
    }
    
    @objc private func systemClockDidChange(_ notification: Notification) {
        NSLog("systemClockDidChange") //*
        DispatchQueue.main.async { [weak self] in self?.reset() }
    }
    
    @objc private func workspaceDidWake(_ notification: Notification) {
        NSLog("workspaceDidWake") //*
        DispatchQueue.main.async { [weak self] in self?.reset() }
    }
    
    deinit {
        timers.forEach { $0.invalidate() }
        AppDefaults.removeObserver(self, forDefaults: [.autoOnLatitude, .autoOnLongitude])
        NotificationCenter.default.removeObserver(self)
        NSWorkspace.shared.notificationCenter.removeObserver(self)
    }
}

private final class SystemAppearanceImpl: NSObject {
    private let effectiveAppearanceObv: NSKeyValueObservation
    
    override init() {
        if #available(OSXApplicationExtension 10.14, *) {
            effectiveAppearanceObv = NSApp.observe(\.effectiveAppearance) { _, _ in
                guard let bestMatch = NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) else { return }
                AppDefaults.isOn = bestMatch == .darkAqua
            }
            super.init()
            guard let bestMatch = NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) else { return }
            AppDefaults.isOn = bestMatch == .darkAqua
        } else {
            fatalError()
        }
    }
}

extension AutoOnMode {
    fileprivate func makeImpl() -> NSObject? {
        switch self {
        case .manual:   return nil
        case .custom:   return CustomTimeImpl()
        case .sunset:   return SunsetTimeImpl()
        case .system:   return SystemAppearanceImpl()
        }
    }
}

extension RunLoop {
    fileprivate func add<S: Sequence>(_ timers: S, forMode mode: Mode = .common) where S.Element == Timer {
        for timer in timers {
            add(timer, forMode: mode)
        }
    }
}
