//
//  AppDelegate.swift
//  Nightlight
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import AppKit

@NSApplicationMain
final class AppDelegate: NSObject {}

extension AppDelegate: NSApplicationDelegate {
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
