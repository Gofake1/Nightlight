//
//  Calendar+.swift
//  SafariExtension
//
//  Created by David Wu on 8/15/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import Foundation

extension Calendar {
    func date(timeInSeconds seconds: Int) -> Date? {
        let hour = seconds / 3600
        let minute = (seconds - (hour * 3600)) / 60
        let second = seconds - (hour * 3600) - (minute * 60)
        assert(second == 0)
        return date(bySettingHour: hour, minute: minute, second: 0, of: Date())
    }
}
