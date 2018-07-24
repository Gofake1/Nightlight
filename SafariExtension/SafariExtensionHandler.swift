//
//  SafariExtensionHandler.swift
//  SafariExtension
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import SafariServices

class SafariExtensionHandler: SFSafariExtensionHandler {
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String: Any]?) {
        switch messageName {
        case "READY":
            // TODO: Check if on
            if let hrefs = userInfo?["hrefs"] as? [String] {
                // TODO: Read cached styles
                // if cachedStyles == nil {
                //     page.dispatchMessageToScript(withName: "START_AND_PROCESS")
                // } else {
                //     page.dispatchMessageToScript(withName: "START", userInfo: cachedStyles)
                // }
                page.dispatchMessageToScript(withName: "START_AND_PROCESS") //*
            } else {
                page.dispatchMessageToScript(withName: "START_AND_PROCESS")
            }
        case "processedStyles":
            NSLog("\(userInfo ?? [:])") //*
            // TODO: Cache styles
        default: break
        }
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController.shared
    }
}
