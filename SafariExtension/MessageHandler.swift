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
    
    static func stateReady(page: SFSafariPage) {
        impl.stateReady(page: page)
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
    func stateReady(page: SFSafariPage)
}

final class DisabledMessageHandlerImpl {
    init() {
        SFSafariApplication.dispatchMessageToActivePage(withName: "STOP")
    }
}

final class EnabledMessageHandlerImpl {
    init() {
        SFSafariApplication.dispatchMessageToActivePage(withName: "START")
    }
}

extension DisabledMessageHandlerImpl: MessageHandlerImplType {
    func stateReady(page: SFSafariPage) {
        // Do nothing
    }
}

extension EnabledMessageHandlerImpl: MessageHandlerImplType {
    func stateReady(page: SFSafariPage) {
        page.dispatchMessageToScript(withName: "START")
    }
}

extension Bool {
    fileprivate func makeMessageHandlerImpl() -> MessageHandlerImplType {
        return self ? EnabledMessageHandlerImpl() : DisabledMessageHandlerImpl()
    }
}
