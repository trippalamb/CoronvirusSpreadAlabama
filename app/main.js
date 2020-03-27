var gd;
var countyGD;

function main() {

    Plotly.d3.json('http://trippalamb.com/coronavirus-spread-alabama/AlabamaCounties.json', function (counties) {

        Plotly.d3.csv('http://trippalamb.com/coronavirus-spread-alabama/AlabamaCounties_TotalCases.csv', function (err, csv) {
        //Plotly.d3.csv('http://localhost:3000/AlabamaCounties_TotalCases.csv', function (err, csv) {

            var casesHeaders = Object.keys(csv[0]).filter((a)=> a.indexOf("cases-") !== -1)
            var numberOfDays = casesHeaders.length;
            $("#date-slider").attr('max', numberOfDays);
            $("#date-slider").val(numberOfDays);


            var max = 0;
            var h = "cases-" + getYesterdayDateHeader();
            csv.forEach((row) => {
                var n = parseInt(row[h]);
                max = (n > max) ? n : max;
            });

             var dateHeader = "cases-" + getDateHeader();
            //var dateHeader = casesHeaders[numberOfDays-1];
            drawPlot(csv, counties, dateHeader, max);

            $("#date-slider").on("change", function () {
                dateHeader = "cases-" + getDateHeader();
                redrawPlot(csv, counties, dateHeader, max);
            });

            $("input[name='radio-scale']").on("change", function () {
                dateHeader = "cases-" + getDateHeader();
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
                dateHeader = "cases-" + getDateHeader();
                redrawPlot(csv, counties, dateHeader, max);
            });

        });
    });
}

function countyModalLogic(name, csv, counties) {

    $("#countyModal").find("h5.modal-title").text(name);
    var cd = getCountyData(name, csv);

    $("#Pop-Row td").text(cd.population);
    $("#Density-Row td").text(cd.density + " Persons / mile^2");
    $("#Case-Row td").text(cd.cases);
    $("#New-Cases-Row td").text(cd.newCases);
    $("#Infected-Row td").text(Math.round(cd.percentInfected*1000)/1000 + "%");
    $("#Death-Row td").text(cd.deaths);
    $("#New-Deaths-Row td").text(cd.newDeaths);
    $("#Growth-Row td").text(Math.round(cd.growthRate*100)/100);

    var geojson = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/USA/AL/" + name + ".geo.json";
    Plotly.d3.json(geojson, function (county) {
        var data = [{
            type: 'scattermapbox',
            lat: [NaN],
            lon: [NaN]
        }];

        var zoom = 7.5;


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
    var h = getPrevDateHeader(1)
    var prevH = getPrevDateHeader(2);
    var caseHeader = "cases-" + h;
    var prevCaseHeader = "cases-" + prevH;
    var deathHeader = "deaths-" + h;
    var prevDeathHeader = "deaths-" + prevH;
    var deaths = (typeof(d[deathHeader]) !== "undefined") ? parseFloat(d[deathHeader]) : 0;
    var prevDeaths = (typeof(d[prevDeathHeader]) !== "undefined") ? parseFloat(d[prevDeathHeader]) : 0;

    var population = parseFloat(d.Population);
    var cases = parseFloat(d[caseHeader]);
    var percentInfected = (cases/population)*100;
    var newCases = cases - parseFloat(d[prevCaseHeader]);
    var newDeaths = deaths - prevDeaths;

    var growthRate = calcAvgGrowthRate(d);

    return {
        population:population,
        density:parseFloat(d.Density),
        latitude:parseFloat(d.Latitude),
        longitude:parseFloat(d.Longitude),
        cases:cases,
        percentInfected: percentInfected,
        newCases:newCases,
        deaths:deaths,
        prevDeathHeader:newDeaths,
        growthRate:growthRate
    };
}

function calcAvgGrowthRate(d){
    var keys = Object.keys(d).filter((k) => k.indexOf("cases-") !== -1);
    var vals = keys.map((k) => parseFloat(d[k]));
    var growths = [];
    for(var i = 0; i<(vals.length - 1); i++){
        if(vals[i] !== 0){growths.push(vals[i+1]/vals[i]);}
    }
    if(growths.length === 0){
        return 0.0;
    else{
        return growths.reduce((a, c) => a + c)/growths.length;
    }
    
}

function getDateHeader() {

    var today = new Date();
    var max = parseInt($("#date-slider").attr('max'));
    var val = max - parseInt($("#date-slider").val());
    var millisecondsAgo = (val + 1) * 24 * 60 * 60 * 1000;
    var day = new Date(today.getTime() - millisecondsAgo);

    var month = day.getMonth() + 1;
    //month = (month > 9) ? "" + month : "0" + month;
    var d = day.getDate();
    //d = (d > 9) ? "" + d : "0" + d;

    return day.getFullYear() + "-" + month + "-" + d;
}

function getYesterdayDateHeader() {
    var today = new Date();

    var yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));

    var month = yesterday.getMonth() + 1;
    //month = (month > 9) ? "" + month : "0" + month;
    var d = yesterday.getDate();
    //d = (d > 9) ? "" + d : "0" + d;

    return yesterday.getFullYear() + "-" + month + "-" + d;
}

function getPrevDateHeader(back) {
    var today = new Date();

    var prevDay = new Date(today.getTime() - (back*24 * 60 * 60 * 1000));

    var month = prevDay.getMonth() + 1;
    //month = (month > 9) ? "" + month : "0" + month;
    var d = prevDay.getDate();
    //d = (d > 9) ? "" + d : "0" + d;

    return prevDay.getFullYear() + "-" + month + "-" + d;
}

function drawPlot(csv, counties, dateHeader, max) {


    data = buildData(csv, counties, dateHeader, max);
    var lat = 32.5;
    var lon = -86.9023;
    var zoom = 6.0;
    var title = dateHeader.slice(dateHeader.indexOf("-") + 1);

    var layout = {
        title: "Alabama Coronavirus County Map [" + title + "]",
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
    var title = dateHeader.slice(dateHeader.indexOf("-") + 1);
    layout.title = "Alabama Coronavirus County Map [" + title + "]";
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

