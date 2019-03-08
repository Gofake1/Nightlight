//
//  MessageHandler.swift
//  SafariExtension
//
//  Created by David Wu on 8/16/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import Foundation
import class SafariServices.SFSafariApplication
import class SafariServices.SFSafariPage

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

typealias StyleSheetResource = String

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
                    let resource = StyleSheetResource(data: data, encoding: .utf8)!.fixed(url: url)
                    page.dispatchMessageToScript(withName: "resource", userInfo: ["resource": resource])
                    let cachedRes = CachedURLResponse(response: res, data: resource.data(using: .utf8)!)
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

extension Array where Element == ACMatch {
    /// - precondition: Array is sorted
    fileprivate func removingOverlaps() -> [Element] {
        guard count > 1 else { return self }
        var withoutOverlaps = [self[0]]
        for element in self[1...] {
            let last = withoutOverlaps.last!
            if (last.0 == element.0 && last.1 <= element.1) {
                withoutOverlaps.removeLast()
            }
            withoutOverlaps.append(element)
        }
        return withoutOverlaps
    }
}

extension String {
    fileprivate func replacingOccurrences(mapping: [String: String], trie: ACTrie) -> String {
        let matches = trie.match(string: self).removingOverlaps()
        var newStr = self
        for match in matches.reversed() {
            let startIdx = index(startIndex, offsetBy: match.0)
            let endIdx = index(startIndex, offsetBy: match.1)
            let replacement = mapping[match.2]!
            newStr.replaceSubrange(startIdx...endIdx, with: replacement)
        }
        return newStr
    }
}

private let _trie = ACTrie(matching: [
    "url(//", "url('//", "url(\"//",
    "url(http:", "url('http:", "url(\"http:",
    "url(https:", "url('https:", "url(\"https:",
    "url(data:", "url('data:", "url(\"data:",
    "url(", "url('", "url(\"",
    "url(/", "url('/", "url(\""
    ])

extension StyleSheetResource {
    fileprivate func fixed(url: URL) -> StyleSheetResource {
        // Replace relative URLs with absolute
        var uc = URLComponents(url: url, resolvingAgainstBaseURL: true)!
        let parent: String = {
            let parentPath = url.pathComponents.dropFirst().dropLast()
            $0.path = parentPath.isEmpty ? "" : "/"+parentPath.joined(separator: "/")
            $0.query = nil
            return $0.string!
        }(&uc)
        let root: String = {
            $0.path = ""
            return $0.string!
        }(&uc)
        let mapping = [
            "url(//": "url(//",
            "url('//": "url('//",
            "url(\"//": "url(\"//",
            "url(http:": "url(http:",
            "url('http:": "url('http:",
            "url(\"http:": "url(\"http:",
            "url(https:": "url(https:",
            "url('https:": "url('https:",
            "url(\"https:": "url(\"https:",
            "url(data:": "url(data:",
            "url('data:": "url('data:",
            "url(\"data:": "url(\"data:",
            "url(": "url(\(parent)/",
            "url('": "url('\(parent)/",
            "url(\"": "url(\"\(parent)/",
            "url(/": "url(\(root)/",
            "url('/": "url('\(root)/",
            "url(\"/": "url(\"\(root)/"
        ]
        return replacingOccurrences(mapping: mapping, trie: _trie)
    }
}
