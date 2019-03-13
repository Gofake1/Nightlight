//
//  SafariExtensionViewController.swift
//  SafariExtension
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import AppKit
import struct CoreLocation.CLLocationCoordinate2D
import typealias CoreLocation.CLLocationDegrees
import class SafariServices.SFSafariApplication
import class SafariServices.SFSafariExtensionViewController

final class SafariExtensionViewController: SFSafariExtensionViewController {
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
    
    override func viewDidAppear() {
        isOnCheckbox.state = AppDefaults.isOn ? .on : .off
        autoOnLabel.stringValue = makeAutoOnLabelText()
    }
    
    @IBAction func isOnCheckboxChanged(_ sender: NSButton) {
        AppDefaults.isOn = sender.state == .on
    }
    
    @IBAction func toggleForThisPage(_ sender: NSButton) {
        SFSafariApplication.dispatchMessageToActivePage(withName: "TOGGLE")
    }
    
    private func makeAutoOnLabelText() -> String {
        switch AppDefaults.autoOnMode {
        case .manual:
            return "Nightlight"
        case .custom:
            return makeCustomAutoOnLabelText(from: AppDefaults.autoOnFromTime, to: AppDefaults.autoOnToTime)
        case .sunset:
            return makeSunsetAutoOnLabelText(latitude: AppDefaults.autoOnLatitude,
                                             longitude: AppDefaults.autoOnLongitude)
        case .system:
            return "Nightlight: Match System Appearance"
        }
    }
    
    private func makeCustomAutoOnLabelText(from: Int, to: Int) -> String {
        let builder = Date()
        let fromDate = Calendar.autoupdatingCurrent.date(timeInSeconds: from, using: builder)!
        let toDate = Calendar.autoupdatingCurrent.date(timeInSeconds: to, using: builder)!
        return "Nightlight: \(df.string(from: fromDate)) - \(df.string(from: toDate))"
    }
    
    private func makeSunsetAutoOnLabelText(latitude: CLLocationDegrees?, longitude: CLLocationDegrees?) -> String {
        guard let latitude = latitude, let longitude = longitude else { return "Nightlight: No coordinate set" }
        guard let (fromDate, toDate) = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            .makeDatesForLabel() else { return "Nightlight: Invalid coordinate" }
        return "Nightlight: \(df.string(from: fromDate)) - \(df.string(from: toDate))"
    }
}
