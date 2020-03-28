const fs = require("fs");
var usaCases = readCsvSync("./covid_confirmed_usafacts.csv");
var usaDeaths = readCsvSync("./covid_deaths_usafacts.csv");
var mine = readCsvSync("./AlabamaCounties_TotalCases.csv");

var uf_case_keys = Object.keys(usaCases[0]).filter((a) => /\//.test(a));
var uf_death_keys = Object.keys(usaDeaths[0]).filter((a) => /\//.test(a));

var newCSV = [];
mine.forEach((row)=>{
    var obj = {
        County:row.County,
        Population:row.Population,
        Density:row.Density,
        Latitude:row.Latitude,
        Longitude:row.Longitude,
    };

        // console.log(row.County);
    var i = usaCases.findIndex((a)=> a["County Name"] === (row.County + " County"));

    uf_case_keys.forEach((k)=>{
        var s = k.split("/");
        var d = "cases-" + s[2] + "-" + s[0] + "-" + s[1];
        obj[d] = usaCases[i][k];
    })

    i = usaDeaths.findIndex((a)=> a["County Name"] === (row.County + " County"));
    uf_death_keys.forEach((k)=>{
        var s = k.split("/");
        var d = "deaths-" + s[2] + "-" + s[0] + "-" + s[1];
        obj[d] = usaDeaths[i][k];
    })
    i++;
    newCSV.push(obj);
})
writeCsvSync("newCounties.csv", newCSV)

function readCsvSync(file, delimiter){
    var csvObj = {};
    var csvArr = [];
    csvArr.skippedLines = [];

    var content = fs.readFileSync(file, 'utf8');
    var lines = content.split(/\r?\n/);
    

    if(typeof(delimiter) === "undefined"){
        delimiter = ",";
    }

    var rgDelim = new RegExp(delimiter);
    var fields = lines[0].trim().split(rgDelim);
    csvArr.headers = fields;

    var width = fields.length;

    for(var i = 1; i < lines.length; i++){
        if(lines[i] !== ""){
            var vals = lines[i].trim().split(rgDelim);
            if(vals.length === width){
                for(var j = 0; j < width; j++){
                    csvObj[fields[j]] = vals[j];
                }

                csvArr.push(csvObj);
                csvObj = {};
            }
            else{
                console.log("error: val length does not match expected");
            }
        }
    }

    return csvArr;
}

function writeCsvSync(file, objArr){
    var content = "";

    var keys = Object.keys(objArr[0]);
    for(var j = 0; j < keys.length; j++){
        if(j === 0){
            content += keys[j];
        }
        else{
            content += "," + keys[j];
        }
    }
    content += "\r\n";

    for(var i = 0; i < objArr.length; i++){
        for(var j = 0; j<keys.length; j++){
            if(j=== 0){
                content += objArr[i][keys[j]];
            }
            else{
                content += "," + objArr[i][keys[j]];
            }
        }
        content += "\r\n";
    }

    fs.writeFileSync(file, content, "utf8");

    return true;
}

function getDateHeader(){

    var today = new Date();

    var month = today.getMonth() + 1;
    month = (month > 9) ? "" + month: "0" + month;
    var d = today.getDate();
    d = (d > 9) ? "" + d: "0" + d;

    return today.getFullYear() + "-" + month + "-" + d;
}