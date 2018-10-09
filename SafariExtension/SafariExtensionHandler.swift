//
//  SafariExtensionHandler.swift
//  SafariExtension
//
//  Created by David Wu on 7/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import SafariServices

final class SafariExtensionHandler: SFSafariExtensionHandler {    
    override init() {
        super.init()
        // The system instantiates this class often, so KVO is handled by helper singletons
        _ = AutoOn.shared
        _ = IsOnObserver.shared
    }
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String: Any]?) {
        switch messageName {
        case "READY":
            MessageHandler.stateReady(page: page)
        case "wantsResource":
            MessageHandler.wantsResource(page: page, href: userInfo!["href"]! as! String)
        default:
            fatalError()
        }
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController.shared
    }
}
