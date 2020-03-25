var gd;
var countyGD;

function main() {

    Plotly.d3.json('http://trippalamb.com/coronavirus-spread-alabama/AlabamaCounties.json', function (counties) {

        Plotly.d3.csv('http://trippalamb.com/coronavirus-spread-alabama/AlabamaCounties_TotalCases.csv', function (err, csv) {

            var numberOfDays = Object.keys(csv[0]).length - 5;
            $("#date-slider").attr('max', numberOfDays);
            $("#date-slider").val(numberOfDays);


            var max = 0;
            var h = getYesterdayDateHeader();
            csv.forEach((row) => {
                var n = parseInt(row[h]);
                max = (n > max) ? n : max;
            });

            var dateHeader = getDateHeader();
            drawPlot(csv, counties, dateHeader, max);

            $("#date-slider").on("change", function () {
                dateHeader = getDateHeader();
                redrawPlot(csv, counties, dateHeader, max);
            });

            $("input[name='radio-scale']").on("change", function () {
                dateHeader = getDateHeader();
                redrawPlot(csv, counties, dateHeader, max);
            });

            $("#move-back").on("click", function () {
                var min = parseInt($("#date-slider").attr('min'));
                var val = parseInt($("#date-slider").val()) - 1;
                val = (val < min) ? min : val;
                $("#date-slider").val(val);
                $("#date-slider").trigger("change");

            });

            $("#move-forward").on("click", function () {
                var max = parseInt($("#date-slider").attr('max'));
                var val = parseInt($("#date-slider").val()) + 1;
                val = (val > max) ? max : val;
                $("#date-slider").val(val);
                $("#date-slider").trigger("change");

            });

            $("#county-data tbody tr").on('click', function () {
                var name = $(this).find("th").text();

                countyModalLogic(name, csv, counties);

            });

            $(window).on("resize", () => {
                dateHeader = getDateHeader();
                redrawPlot(csv, counties, dateHeader, max);
            });

        });
    });
}

function countyModalLogic(name, csv, counties) {

    $("#countyModal").find("h5.modal-title").text(name);
    var cd = getCountyData(name, csv);

    var geojson = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/USA/AL/" + name + ".geo.json";
    Plotly.d3.json(geojson, function (county) {
        var data = [{
            type: 'scattermapbox',
            lat: [NaN],
            lon: [NaN]
        }];

        var zoom = 8.2;


        var layout = {
            autosize:true,
            showLegend: false,
            margin: {
                l: 20,
                r: 20,
                b: 20,
                t: 20,
                pad: 4
            },
            mapbox: {
                center: {
                    lat: cd.latitude,
                    lon: cd.longitude
                },
                style: 'open-street-map',
                zoom: zoom,
                layers: [
                    {
                        sourcetype: 'geojson',
                        source: county,
                        type: 'fill',
                        color: 'rgba(163,22,19,0.4)'
                    }
                ]
            }
        }

        $("#countyModal").modal("show");
        countyGD = document.getElementById('county-plot');
        Plotly.newPlot(countyGD, data, layout, { responsize: true, displayModeBar: false });
        

    })

}

function getCountyData(name, csv){
    var d = csv.filter((r) => r.County === name)[0];
    return {
        population:parseFloat(d.Population),
        density:parseFloat(d.Density),
        latitude:parseFloat(d.Latitude),
        longitude:parseFloat(d.Longitude)
    };
}

function getDateHeader() {

    var today = new Date();
    var max = parseInt($("#date-slider").attr('max'));
    var val = max - parseInt($("#date-slider").val());
    var millisecondsAgo = (val + 1) * 24 * 60 * 60 * 1000;
    var day = new Date(today.getTime() - millisecondsAgo);

    var month = day.getMonth() + 1;
    month = (month > 9) ? "" + month : "0" + month;
    var d = day.getDate();
    d = (d > 9) ? "" + d : "0" + d;

    return day.getFullYear() + "-" + month + "-" + d;
}

function getYesterdayDateHeader() {
    var today = new Date();

    var yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));

    var month = yesterday.getMonth() + 1;
    month = (month > 9) ? "" + month : "0" + month;
    var d = yesterday.getDate();
    d = (d > 9) ? "" + d : "0" + d;

    return yesterday.getFullYear() + "-" + month + "-" + d;
}

function drawPlot(csv, counties, dateHeader, max) {


    data = buildData(csv, counties, dateHeader, max);
    var lat = 32.5;
    var lon = -86.9023;
    var zoom = 6.0;

    var layout = {
        title: "Alabama Coronavirus County Map [" + dateHeader + "]",
        autosize: true,
        showLegend: true,
        mapbox: {
            style: "open-street-map",
            center: {
                lat: lat,
                lon: lon
            },
            zoom: zoom,
        }
    }

    gd = document.getElementById('container');
    Plotly.newPlot(gd, data, layout, { responsize: true });

}

function redrawPlot(csv, counties, dateHeader, max) {

    data = buildData(csv, counties, dateHeader, max);
    var layout = gd.layout;
    layout.title = "Alabama Coronavirus County Map [" + dateHeader + "]";
    Plotly.react(gd, data, layout, { responsize: true });

}


function buildData(csv, counties, dateHeader, max) {

    var data = [];
    var zmax = 0;

    var maxType = $('input[name="radio-scale"]:checked').val();
    if (maxType === "totalScale") {
        zmax = max;
    }
    else {
        csv.forEach((row) => {
            var n = parseInt(row[dateHeader]);
            zmax = (n > zmax) ? n : zmax;
        });
    }


    var values = csv.map((row) => row[dateHeader]);
    csv.forEach((row) => {
        $("#" + row.County.replace(" ", "-") + "-Row").find("td").text(row[dateHeader]);
    });

    var data = [{
        type: 'choroplethmapbox',
        locations: ["Autauga", "Baldwin", "Barbour", "Bibb", "Blount", "Bullock", "Butler", "Calhoun", "Chambers", "Cherokee", "Chilton", "Choctaw", "Clarke", "Clay", "Cleburne", "Coffee", "Colbert", "Conecuh", "Coosa", "Covington", "Crenshaw", "Cullman", "Dale", "Dallas", "DeKalb", "Elmore", "Escambia", "Etowah", "Fayette", "Franklin", "Geneva", "Greene", "Hale", "Henry", "Houston", "Jackson", "Jefferson", "Lamar", "Lauderdale", "Lawrence", "Lee", "Limestone", "Lowndes", "Macon", "Madison", "Marengo", "Marion", "Marshall", "Mobile", "Monroe", "Montgomery", "Morgan", "Perry", "Pickens", "Pike", "Randolph", "Russell", "Shelby", "St. Clair", "Sumter", "Talladega", "Tallapoosa", "Tuscaloosa", "Walker", "Washington", "Wilcox", "Winston"],
        geojson: counties,
        z: values,
        zmin: 0,
        zmax: zmax,
        featureidkey: "properties.name",
        marker: {
            opacity: 0.5
        }
    }];

    return data;
}

