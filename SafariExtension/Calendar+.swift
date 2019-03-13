//
//  Calendar+.swift
//  SafariExtension
//
//  Created by David Wu on 8/15/18.
//  Copyright © 2018 Gofake1. All rights reserved.
//

import struct Foundation.Calendar
import struct Foundation.Date

extension Calendar {
    func date(timeInSeconds seconds: Int, using date: Date = Date()) -> Date? {
        let hour = seconds / 3600
        let minute = (seconds - (hour * 3600)) / 60
        let second = seconds - (hour * 3600) - (minute * 60)
        assert(second == 0)
        return self.date(bySettingHour: hour, minute: minute, second: 0, of: date)
    }
}
