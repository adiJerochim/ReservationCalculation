var Reservation = (function () {

    var milliseconds = 1000;
    var secondsInDay = 86400;

    /**
     * Parse CSV file to JSON
     * @param {String} csv 
     * @return {JSON} csv data parsed to JSON
     */
    function parseCSV(csv) {
        return csv.split('\n').slice(1).map(function (line) {
            var currentline = line.split(',');
            return {
                capacity: parseInt(currentline[0]),
                price: parseInt(currentline[1]),
                start: Date.parse(currentline[2].trim()) / milliseconds,
                end: currentline[3] ? Date.parse(currentline[3].trim()) / milliseconds : ''
            };
        });
    }

    /**
     * Sum the revenue and the capacity of the unreserved offices from parsed csv
     * @param {JSON} data
     * @param {Number} month 
     * @param {Number} year
     * @return {Object} {capacity: sum, revenue: sum}
     */
    function getExpected(data, month, year) {
        var price = 0;
        var capacity = 0;
        var first_day = Date.parse(year + "/" + (month)) / milliseconds;

        if (month === 12) {
            year++;
            month = 1;
        } else {
            month++;
        }

        var end_day = Date.parse(year + "/" + (month)) / milliseconds;
        var month_length = Math.round((end_day - first_day) / secondsInDay);

        data.forEach(function (item) {
            if (item.start < end_day && (!item.end || item.end > first_day)) {
                // Start before the specific month
                var price_per_day = item.price / month_length;
                if (item.start > first_day) {
                    // Start at the middle of the specific month
                    if (item.end && item.end < end_day) {
                        // End at the middle of the specific month
                        price += price_per_day * Math.round((item.end - item.start) / secondsInDay);
                    } else {
                        // End after the specific month
                        price += price_per_day * Math.round((end_day - item.start) / secondsInDay);
                    }
                } else if (item.end && item.end < end_day) {
                    // End at the middle of the specific month
                    price += price_per_day * Math.round((item.end - first_day) / secondsInDay);
                } else {
                    // End after the specific month
                    price += item.price;
                }
            } else {
                // Not reserved
                capacity += item.capacity;
            }
        });

        return {
            revenue: Math.round(price),
            capacity: capacity
        };
    }

    //A promise to get the data only once
    var parsedDataPromise = new Promise(function (resolve, reject) {
        $.ajax({
            url: "https://gist.githubusercontent.com/yonbergman/7a0b05d6420dada16b92885780567e60/raw/114aa2ffb1c680174f9757431e672b5df53237eb/data.csv",
            success: function (data) {
                return resolve(parseCSV(data));
            },
            error: function (err) {
                return reject(err);
            }
        });
    });


    return {
        /**
         * Return reservation data by month and year
         * @param {Number} month
         * @param {Number} year 
         * @return {Promise} when resolved return object {capacity: sum, revenue: sum}
         */
        expected: function (month, year) {
            return parsedDataPromise.then(function (data) {
                return getExpected(data, month, year);
            });
        }
    };
})();
