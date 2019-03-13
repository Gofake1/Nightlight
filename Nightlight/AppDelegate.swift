//
//  AppDelegate.swift
//  Nightlight
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import AppKit

@NSApplicationMain
final class AppDelegate: NSObject {
    @IBAction func emptyCache(_ sender: NSMenuItem) {
        DistributedNotificationCenter.default().post(name: _notificationEmptyCache, object: _nightlight)
    }
    
    @IBAction func showHelp(_ sender: NSMenuItem) {
        NSWorkspace.shared.open(URL(string: "https://gofake1.net/projects/nightlight.html")!)
    }
}

extension AppDelegate: NSApplicationDelegate {
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
