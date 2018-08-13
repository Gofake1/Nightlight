//
//  SafariExtensionHandler.swift
//  SafariExtension
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import SafariServices

final class SafariExtensionHandler: SFSafariExtensionHandler {
    private var autoOnTimer: NSObject?
    private lazy var messageHandler = makeMessageHandler(AppDefaults.isOn)
    
    override init() {
        super.init()
        autoOnTimer = makeAutoOnTimer(AppDefaults.autoOnMode)
        AppDefaults.addObserver(self, forDefaults: [.autoOnMode, .isOn])
    }
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String: Any]?) {
        switch messageName {
        case "READY":
            messageHandler.stateReady(page: page, userInfo: userInfo)
        case "processedStyles":
            messageHandler.processedStyles(page: page, userInfo: userInfo)
        default:
            fatalError()
        }
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController.shared
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        switch AppDefaultKind(rawValue: keyPath!)! {
        case .autoOnMode:
            autoOnTimer = makeAutoOnTimer(AutoOnMode(rawValue: change![.newKey]! as! String)!)
        case .isOn:
            guard let isOn = change![.newKey] else { return }
            NSLog("isOn changed: \(isOn as! Bool)") //*
            messageHandler = makeMessageHandler(isOn as! Bool)
        default:
            fatalError()
        }
    }
    
    private func makeAutoOnTimer(_ autoOnMode: AutoOnMode) -> NSObject? {
        switch autoOnMode {
        case .manual:   return nil
        case .custom:   return CustomTimer()
        case .sunset:   return SunsetTimer()
        }
    }
    
    private func makeMessageHandler(_ isOn: Bool) -> MessageHandlerType {
        return isOn ? EnabledMessageHandler() : DisabledMessageHandler()
    }
}

protocol MessageHandlerType {
    func stateReady(page: SFSafariPage, userInfo: [String: Any]?)
    func processedStyles(page: SFSafariPage, userInfo: [String: Any]?)
}

final class DisabledMessageHandler {
    init() {
        SFSafariApplication.dispatchMessageToActivePage(withName: "STOP")
    }
}

final class EnabledMessageHandler {
    init() {
        SFSafariApplication.dispatchMessageToActivePage(withName: "START")
    }
}

extension DisabledMessageHandler: MessageHandlerType {
    func stateReady(page: SFSafariPage, userInfo: [String : Any]?) {
        page.dispatchMessageToScript(withName: "STOP")
    }
    
    func processedStyles(page: SFSafariPage, userInfo: [String : Any]?) {
        // Do nothing
    }
}

extension EnabledMessageHandler: MessageHandlerType {
    func stateReady(page: SFSafariPage, userInfo: [String : Any]?) {
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
    }
    
    func processedStyles(page: SFSafariPage, userInfo: [String : Any]?) {
        // TODO: Caching
        NSLog("\(userInfo ?? [:])") //*
    }
}

extension SFSafariApplication {
    static func dispatchMessageToActivePage(withName name: String, userInfo: [String: Any]? = nil) {
        getActiveWindow {
            $0?.getActiveTab {
                $0?.getActivePage {
                    $0?.dispatchMessageToScript(withName: name, userInfo: userInfo)
                }
            }
        }
    }
}
