//
//  CacheProxy.swift
//  SafariExtension
//
//  Created by David Wu on 10/24/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import Foundation

final class CacheProxy: NSObject {
    static let shared = CacheProxy()
    
    private override init() {
        super.init()
        DistributedNotificationCenter.default().addObserver(self, selector: #selector(emptyCache),
                                                            name: _notificationEmptyCache,
                                                            object: _nightlight, suspensionBehavior: .drop)
    }
    
    @objc private func emptyCache() {
        URLCache.shared.removeAllCachedResponses()
    }
    
    deinit {
        DistributedNotificationCenter.default().removeObserver(self)
    }
}
