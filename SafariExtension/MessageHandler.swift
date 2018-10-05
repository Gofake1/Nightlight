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
    
    static func wantsResource(page: SFSafariPage, href: String) {
        impl.wantsResource(page: page, href: href)
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
    func wantsResource(page: SFSafariPage, href: String)
}

extension MessageHandlerImplType {
    func wantsResource(page: SFSafariPage, href: String) {
        NSLog("wantsResource \(href)") //*
        guard let url = URL(string: href) else { return }
        let request = URLRequest(url: url)
        if let data = URLCache.shared.cachedResponse(for: request)?.data {
            NSLog("cache hit") //*
            let resource = String(data: data, encoding: .utf8)!
            page.dispatchMessageToScript(withName: "resource", userInfo: ["resource": resource])
        } else {
            NSLog("cache miss") //*
            URLSession.shared.dataTask(with: request) { (data, res, error) in
                if let error = error {
                    NSLog("\(error)") //*
                } else if let data = data, let res = res {
                    let resource = String(data: data, encoding: .utf8)!
                    page.dispatchMessageToScript(withName: "resource", userInfo: ["resource": resource])
                    let cachedRes = CachedURLResponse(response: res, data: data)
                    URLCache.shared.storeCachedResponse(cachedRes, for: request)
                }
            } .resume()
        }
        
    }
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
