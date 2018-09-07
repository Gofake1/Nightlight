//
//  SafariServices+.swift
//  SafariExtension
//
//  Created by David Wu on 9/3/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import SafariServices

extension SFSafariApplication {
    static func dispatchMessageToActivePage(withName name: String) {
        getActiveWindow {
            $0?.getActiveTab {
                $0?.getActivePage {
                    $0?.dispatchMessageToScript(withName: name, userInfo: nil)
                }
            }
        }
    }
}
