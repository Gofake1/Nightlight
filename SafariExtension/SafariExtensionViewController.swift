//
//  SafariExtensionViewController.swift
//  SafariExtension
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import CoreLocation
import SafariServices

class SafariExtensionViewController: SFSafariExtensionViewController {
    @IBOutlet weak var isOnCheckbox: NSButton!
    @IBOutlet weak var autoOnLabel: NSTextField!
    
    static let shared: SafariExtensionViewController = {
        let shared = SafariExtensionViewController()
        shared.preferredContentSize = NSSize(width: 320, height: 80)
        return shared
    }()
    private lazy var df: DateFormatter = {
        let df = DateFormatter()
        df.dateStyle = .none
        df.timeStyle = .short
        return df
    }()
    
    override func viewDidLoad() {
        autoOnLabel.stringValue = makeAutoOnLabelText(mode: AppDefaults.autoOnMode)
        AppDefaults.addObserver(self, forDefaults: [.autoOnMode, .autoOnFromTime, .autoOnToTime,
                                                    .autoOnLatitude, .autoOnLongitude])
    }
    
    override func viewDidAppear() {
        isOnCheckbox.state = AppDefaults.isOn ? .on : .off
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        switch AppDefaultKind(rawValue: keyPath!)! {
        case .autoOnMode:
            autoOnLabel.stringValue = makeAutoOnLabelText(mode: AutoOnMode(rawValue: change![.newKey]! as! String)!)
        case .autoOnFromTime:
            assert(AppDefaults.autoOnMode == .custom)
            autoOnLabel.stringValue = makeCustomAutoOnLabelText(from: change![.newKey]! as! Int,
                                                                to: AppDefaults.autoOnToTime)
        case .autoOnToTime:
            assert(AppDefaults.autoOnMode == .custom)
            autoOnLabel.stringValue = makeCustomAutoOnLabelText(from: AppDefaults.autoOnFromTime,
                                                                to: change![.newKey]! as! Int)
        case .autoOnLatitude:
            assert(AppDefaults.autoOnMode == .sunset)
            autoOnLabel.stringValue = makeSunsetAutoOnLabelText(latitude: change![.newKey] as! CLLocationDegrees?,
                                                                longitude: AppDefaults.autoOnLongitude)
        case .autoOnLongitude:
            assert(AppDefaults.autoOnMode == .sunset)
            autoOnLabel.stringValue = makeSunsetAutoOnLabelText(latitude: AppDefaults.autoOnLatitude,
                                                                longitude: change![.newKey] as! CLLocationDegrees?)
        default:
            fatalError()
        }
    }
    
    @IBAction func isOnCheckboxChanged(_ sender: NSButton) {
        AppDefaults.isOn = sender.state == .on
    }
    
    @IBAction func toggleForThisPage(_ sender: NSButton) {
        SFSafariApplication.dispatchMessageToActivePage(withName: "TOGGLE")
    }
    
    func updateSunsetAutoOnLabel(sunset: Date, sunrise: Date) {
        assert(AppDefaults.autoOnMode == .sunset)
        // View may not be loaded
        guard autoOnLabel != nil else { return }
        autoOnLabel.stringValue = makeSunsetAutoOnLabelText(sunset: sunset, sunrise: sunrise)
    }
    
    private func makeAutoOnLabelText(mode: AutoOnMode) -> String {
        switch mode {
        case .manual:
            return "Manual"
        case .custom:
            return makeCustomAutoOnLabelText(from: AppDefaults.autoOnFromTime, to: AppDefaults.autoOnToTime)
        case .sunset:
            return makeSunsetAutoOnLabelText(latitude: AppDefaults.autoOnLatitude,
                                             longitude: AppDefaults.autoOnLongitude)
        }
    }
    
    private func makeCustomAutoOnLabelText(from: Int, to: Int) -> String {
        let fromDateStr = df.string(from: Calendar.autoupdatingCurrent.date(timeInSeconds: from)!)
        let toDateStr = df.string(from: Calendar.autoupdatingCurrent.date(timeInSeconds: to)!)
        return "Custom: From \(fromDateStr) to \(toDateStr)"
    }
    
    private func makeSunsetAutoOnLabelText(latitude: CLLocationDegrees?, longitude: CLLocationDegrees?) -> String {
        guard let latitude = latitude, let longitude = longitude else { return "Sunset: No coordinate set" }
        guard let (sunset, sunrise) = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            .makeSolarDates()
            else { return "Sunset: Invalid coordinate" }
        return makeSunsetAutoOnLabelText(sunset: sunset, sunrise: sunrise)
    }
    
    private func makeSunsetAutoOnLabelText(sunset: Date, sunrise: Date) -> String {
        return "Sunset: From \(df.string(from: sunset)) to \(df.string(from: sunrise))"
    }
    
    deinit {
        AppDefaults.removeObserver(self, forDefaults: [.autoOnMode, .autoOnFromTime, .autoOnToTime,
                                                       .autoOnLatitude, .autoOnLongitude])
    }
}
