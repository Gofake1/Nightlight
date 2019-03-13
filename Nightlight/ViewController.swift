//
//  ViewController.swift
//  Nightlight
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import AppKit
import struct CoreLocation.CLLocationCoordinate2D
import class SafariServices.SFSafariExtensionManager

final class ViewController: NSViewController {
    @IBOutlet weak var extensionStatusLabel: NSTextField!
    @IBOutlet weak var manualRadio: NSButton!
    @IBOutlet weak var customRadio: NSButton!
    @IBOutlet weak var customFromDatePicker: NSDatePicker!
    @IBOutlet weak var customToDatePicker: NSDatePicker!
    @IBOutlet weak var sunsetRadio: NSButton!
    @IBOutlet weak var sunsetLabel: NSTextField!
    @IBOutlet weak var latitudeField: NSTextField!
    @IBOutlet weak var longitudeField: NSTextField!
    @IBOutlet weak var systemRadio: NSButton!
    
    private let df: DateFormatter = {
        let df = DateFormatter()
        df.dateStyle = .none
        df.timeStyle = .short
        return df
    }()
    
    override func viewDidLoad() {
        AppDefaults.registerDefaults()
        
        setExtensionStatusText { [extensionStatusLabel] in extensionStatusLabel!.stringValue = $0 }
        if #available(macOS 10.14, *) {
            systemRadio.isEnabled = true
        }
        switch AppDefaults.autoOnMode {
        case .manual:   manualRadio.state = .on
        case .custom:   customRadio.state = .on
        case .sunset:   sunsetRadio.state = .on
        case .system:   systemRadio.state = .on
        }
        customFromDatePicker.dateValue = AppDefaults.autoOnFromTime.date
        customToDatePicker.dateValue = AppDefaults.autoOnToTime.date
        sunsetLabel.stringValue = makeSunsetLabelText()
        latitudeField.stringValue = AppDefaults.autoOnLatitude?.description ?? ""
        longitudeField.stringValue = AppDefaults.autoOnLongitude?.description ?? ""
    }
    
    @IBAction func refreshExtensionStatus(_ sender: NSButton) {
        setExtensionStatusText { [extensionStatusLabel] in extensionStatusLabel!.stringValue = $0 }
    }
    
    @IBAction func radioChanged(_ sender: NSButton) {
        switch sender {
        case manualRadio:
            AppDefaults.autoOnMode = .manual
        case customRadio:
            AppDefaults.autoOnMode = .custom
        case sunsetRadio:
            AppDefaults.autoOnMode = .sunset
            sunsetLabel.stringValue = makeSunsetLabelText()
        case systemRadio:
            AppDefaults.autoOnMode = .system
        default:
            fatalError()
        }
    }
    
    @IBAction func datePickerValueChanged(_ sender: NSDatePicker) {
        switch sender {
        case customFromDatePicker:
            AppDefaults.autoOnFromTime = customFromDatePicker.dateValue.secondsPastMidnight
        case customToDatePicker:
            AppDefaults.autoOnToTime = customToDatePicker.dateValue.secondsPastMidnight
        default:
            fatalError()
        }
    }
    
    @IBAction func coordinateFieldValueChanged(_ sender: NSTextField) {
        switch sender {
        case latitudeField:
            AppDefaults.autoOnLatitude = latitudeField.stringValue == "" ? nil : latitudeField.doubleValue
        case longitudeField:
            AppDefaults.autoOnLongitude = longitudeField.stringValue == "" ? nil : longitudeField.doubleValue
        default:
            fatalError()
        }
        sunsetLabel.stringValue = makeSunsetLabelText()
    }
    
    private func setExtensionStatusText(completion completionHandler: @escaping (String) -> ()) {
        let identifier = "net.gofake1.Nightlight.SafariExtension"
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: identifier) {
            if let error = $1 {
                DispatchQueue.main.async { completionHandler(error.localizedDescription) }
            } else if let state = $0 {
                DispatchQueue.main.async { completionHandler(state.isEnabled ? "Nightlight is Enabled" :
                    "Nightlight is Disabled") }
            }
        }
    }
    
    private func makeSunsetLabelText() -> String {
        if let latitude = AppDefaults.autoOnLatitude, let longitude = AppDefaults.autoOnLongitude {
            if let (fromDate, toDate) = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
                .makeDatesForLabel()
            {
                return "From \(df.string(from: fromDate)) to \(df.string(from: toDate))"
            } else {
                return "Error: Invalid coordinate"
            }
        } else {
            return "From --:-- to --:--"
        }
    }
}

extension Date {
    fileprivate var secondsPastMidnight: Int {
        let dc = Calendar.autoupdatingCurrent.dateComponents([.hour, .minute], from: self)
        return (dc.hour! * 3600) + (dc.minute! * 60)
    }
}

extension Int {
    fileprivate var date: Date {
        assert(self >= 0 && self < 86400)
        return Calendar.autoupdatingCurrent.date(from: DateComponents(second: self))!
    }
}
