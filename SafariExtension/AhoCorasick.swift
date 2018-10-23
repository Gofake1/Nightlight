//
//  AhoCorasick.swift
//  SafariExtension
//
//  Created by David Wu on 10/20/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

typealias ACMatch = (Int, Int, String)

class ACNode {
    weak var fail: ACNode?
    var success = [Character: ACNode]()
    var outputs = Set<String>()
    private let depth: Int
    private weak var root: ACNode?
    
    init(depth: Int) {
        self.depth = depth
        root = (depth == 0) ? self : nil
    }
    
    func nextNode(character ch: Character) -> ACNode? {
        if let node = success[ch] {
            return node
        } else if let root = root {
            return root
        } else {
            return nil
        }
    }
    
    func addNode(character ch: Character) -> ACNode {
        if let node = success[ch] {
            return node
        } else {
            let node = ACNode(depth: depth+1)
            success[ch] = node
            return node
        }
    }
    
    func addOutputs(_ outputs: Set<String>) {
        for output in outputs {
            self.outputs.insert(output)
        }
    }
}

class ACTrie {
    let root = ACNode(depth: 0)
    
    init<T: Sequence>(matching keywords: T) where T.Element == String {
        // Build trie
        for keyword in keywords {
            var current = root
            for ch in keyword {
                current = current.addNode(character: ch)
            }
            current.outputs.insert(keyword)
        }
        // Build failure transitions
        var queue = [ACNode]()
        for (_, node) in root.success {
            node.fail = root
            queue.append(node)
        }
        while !queue.isEmpty {
            let current = queue.removeFirst()
            for (ch, target) in current.success {
                queue.append(target)
                var fail = current.fail
                while fail?.nextNode(character: ch) == nil {
                    fail = fail?.fail
                }
                target.fail = fail?.nextNode(character: ch)
                target.addOutputs(target.fail?.outputs ?? [])
            }
        }
    }
    
    static func nextNode(current: ACNode, character ch: Character) -> ACNode {
        var current = current
        var next = current.nextNode(character: ch)
        while next == nil {
            current = current.fail!
            next = current.nextNode(character: ch)
        }
        return next!
    }
    
    func match(string: String) -> [ACMatch] {
        var current = root
        var out = [(Int, Int, String)]()
        for (idx, ch) in string.enumerated() {
            current = ACTrie.nextNode(current: current, character: ch)
            out += current.outputs.map { (idx-$0.count+1, idx, $0) }
        }
        return out
    }
}
