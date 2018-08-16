//
//  ViewController.swift
//  Nightlight
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import Cocoa
import CoreLocation
import SafariServices

class ViewController: NSViewController {
    @IBOutlet weak var extensionStatusLabel: NSTextField!
    @IBOutlet weak var manualRadio: NSButton!
    @IBOutlet weak var customRadio: NSButton!
    @IBOutlet weak var customFromDatePicker: NSDatePicker!
    @IBOutlet weak var customToDatePicker: NSDatePicker!
    @IBOutlet weak var sunsetRadio: NSButton!
    @IBOutlet weak var sunsetLabel: NSTextField!
    @IBOutlet weak var latitudeField: NSTextField!
    @IBOutlet weak var longitudeField: NSTextField!
    
    private let dateFormatter: DateFormatter = {
        let df = DateFormatter()
        df.dateStyle = .none
        df.timeStyle = .short
        return df
    }()
    
    override func viewDidLoad() {
        AppDefaults.registerDefaults()
        
        switch AppDefaults.autoOnMode {
        case .manual:   manualRadio.state = .on
        case .custom:   customRadio.state = .on
        case .sunset:   sunsetRadio.state = .on
        }
        customFromDatePicker.dateValue = AppDefaults.autoOnFromTime.date
        customToDatePicker.dateValue = AppDefaults.autoOnToTime.date
        sunsetLabel.stringValue = makeSunsetLabelText()
        latitudeField.stringValue = AppDefaults.autoOnLatitude?.description ?? ""
        longitudeField.stringValue = AppDefaults.autoOnLongitude?.description ?? ""
        
        SFSafariExtensionManager
            .getStateOfSafariExtension(withIdentifier: "net.gofake1.Nightlight.SafariExtension") { [weak self] in
                if let error = $1 {
                    DispatchQueue.main.async {
                        self!.extensionStatusLabel.stringValue = error.localizedDescription
                    }
                } else if let state = $0 {
                    DispatchQueue.main.async {
                        self!.extensionStatusLabel.stringValue = state.isEnabled ?
                            "Nightlight is Enabled" : "Nightlight is Disabled"
                    }
                }
        }
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
    
    private func makeSunsetLabelText() -> String {
        if let latitude = AppDefaults.autoOnLatitude, let longitude = AppDefaults.autoOnLongitude {
            if let (sunset, sunrise) = CLLocationCoordinate2D(latitude: latitude,
                                                              longitude: longitude).makeSolarDates()
            {
                let sunsetDateStr = dateFormatter.string(from: sunset)
                let sunriseDateStr = dateFormatter.string(from: sunrise)
                return "From \(sunsetDateStr) to \(sunriseDateStr)"
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
