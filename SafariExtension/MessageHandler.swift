//
//  MessageHandler.swift
//  SafariExtension
//
//  Created by David Wu on 8/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import SafariServices

final class MessageHandler {
    fileprivate static var impl = AppDefaults.isOn.makeMessageHandlerImpl()
    
    static func stateReady(page: SFSafariPage, userInfo: [String: Any]?) {
        impl.stateReady(page: page, userInfo: userInfo)
    }
    
    static func processedStyles(page: SFSafariPage, userInfo: [String: Any]?) {
        impl.processedStyles(page: page, userInfo: userInfo)
    }
}

final class IsOnObserver: NSObject {
    static let shared = IsOnObserver()
    
    private override init() {
        super.init()
        AppDefaults.addObserver(self, forDefaults: [.isOn])
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?,
                               context: UnsafeMutableRawPointer?)
    {
        switch AppDefaultKind(rawValue: keyPath!)! {
        case .isOn:
            MessageHandler.impl = (change![.newKey]! as! Bool).makeMessageHandlerImpl()
        default:
            fatalError()
        }
    }
    
    deinit {
        AppDefaults.removeObserver(self, forDefaults: [.isOn])
    }
}

protocol MessageHandlerImplType {
    func stateReady(page: SFSafariPage, userInfo: [String: Any]?)
    func processedStyles(page: SFSafariPage, userInfo: [String: Any]?)
}

final class DisabledMessageHandlerImpl {
    init() {
        SFSafariApplication.dispatchMessageToActivePage(withName: "STOP")
    }
}

final class EnabledMessageHandlerImpl {
    init() {
        SFSafariApplication.dispatchMessageToActivePage(withName: "START_AND_PROCESS") // TODO
    }
}

extension DisabledMessageHandlerImpl: MessageHandlerImplType {
    func stateReady(page: SFSafariPage, userInfo: [String: Any]?) {
        // Do nothing
    }
    
    func processedStyles(page: SFSafariPage, userInfo: [String: Any]?) {
        // Do nothing
    }
}

extension EnabledMessageHandlerImpl: MessageHandlerImplType {
    func stateReady(page: SFSafariPage, userInfo: [String: Any]?) {
        if let hrefs = userInfo?["hrefs"] as? [String] {
            // TODO: Read cached styles
            // if cachedStyles == nil {
            //     page.dispatchMessageToScript(withName: "START_AND_PROCESS")
            // } else {
            //     page.dispatchMessageToScript(withName: "START", userInfo: cachedStyles)
            // }
            page.dispatchMessageToScript(withName: "START_AND_PROCESS") // TODO
        } else {
            page.dispatchMessageToScript(withName: "START_AND_PROCESS")
        }
    }
    
    func processedStyles(page: SFSafariPage, userInfo: [String: Any]?) {
        // TODO: Caching
        NSLog("\(userInfo ?? [:])") //*
    }
}

extension Bool {
    fileprivate func makeMessageHandlerImpl() -> MessageHandlerImplType {
        return self ? EnabledMessageHandlerImpl() : DisabledMessageHandlerImpl()
    }
}

extension SFSafariApplication {
    fileprivate static func dispatchMessageToActivePage(withName name: String) {
        getActiveWindow {
            $0?.getActiveTab {
                $0?.getActivePage {
                    $0?.dispatchMessageToScript(withName: name, userInfo: nil)
                }
            }
        }
    }
}
