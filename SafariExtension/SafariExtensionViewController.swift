//
//  SafariExtensionViewController.swift
//  SafariExtension
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import SafariServices

class SafariExtensionViewController: SFSafariExtensionViewController {
    @IBOutlet weak var isOnCheckbox: NSButton!
    
    static let shared: SafariExtensionViewController = {
        let shared = SafariExtensionViewController()
        shared.preferredContentSize = NSSize(width:320, height:240)
        return shared
    }()
    
    override func viewDidAppear() {
        isOnCheckbox.state = AppDefaults.isOn ? .on : .off
    }
    
    @IBAction func isOnCheckboxChanged(_ sender: NSButton) {
        AppDefaults.isOn = sender.state == .on
    }
}
