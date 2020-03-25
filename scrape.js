const http = require('http');
const fs = require('fs');

http.get('http://alabamapublichealth.gov/infectiousdiseases/2019-coronavirus.html', (resp) => {
  let data = '';

  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received. Print out the result.
  resp.on('end', () => {

      var table = data.match(/<table.*>[\s\S]*<\/table>/);
      var rows = table[0].match(/<tr>([\s\S]*?)<\/tr>/g).slice(2);
      var d = {};
      
      rows.forEach((r) => {
          var m = r.match(/<p>([\s\S]*?)<\/p>/g);
          var county = m[0].match(/<p>([\s\S]*?)<\/p>/)[1];
          var cases = m[1].match(/<p>([\s\S]*?)<\/p>/)[1];
          d[county] = cases;
      });

      var h = getDateHeader();
      var csv = readCsvSync("./AlabamaCounties_TotalCases.csv");
      csv.forEach((r)=>{
          if(typeof(d[r.County]) === "undefined"){r[h] = 0;}
          else{r[h] = d[r.County];}
      });
      
      writeCsvSync("./AlabamaCounties_TotalCases_new.csv", csv);

  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});

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

