let facServers = {
  "CSEC": "cyan",
  "avmnite-02h": "cyan",
  "I.I.I.I": "cyan",
  "run4theh111z": "cyan",
  "w0r1d_d43m0n": "red"
};

export async function main(ns) {

  /*-----------------CSS Modifications-----------------*/
  let css = `
      .progress {
      display: block;
      margin: 0px auto 20px auto;
      
      }
      progress::-webkit-progress-bar {background-color: #000; width: 100%;}
      .scan-link{
      overflow-y:scroll;text-decoration:underline dotted; 
      }
      .scan-link:hover 
      {  
      text-decoration:solid underline 3px;
      }
      .cctlink{
      }
      .cctlink:hover
      {
      text-decoration:solid underline 3px;
      }`
  const doc = eval('document');
  if (doc.head.querySelector("#scan-link-css")) doc.head.querySelector("#scan-link-css").innerText = css;
  else doc.head.insertAdjacentHTML("beforeEnd", `<style id=scan-link-css>${css}</style>`);

  /*---------------------------------------------------*/
  /*---------------------Main Loop---------------------*/
  while (true) {
let output = "";
let list = ["home"];
let order = [["home"]];
let temp = [];
let tempfiles = [];
let depthchart = "";
let ramsuffix = " GB";
let temp2 = [];
let temp3 = [];
let ramColor = "cyan";
let karmaval = -Math.round(ns.heart.break()) / 540;
await ns.sleep(10)
output = `<font color='lime'> Karma:` + Math.round(ns.heart.break()) + `<br>
        <span class="MuiLinearProgress-root MuiLinearProgress-colorSecondary MuiLinearProgress-determinate css-15ngs1i" role="progressbar" style="width:50%" aria-valuenow="5" aria-valuemin="0" aria-valuemax="100">
        <span class="MuiLinearProgress-bar MuiLinearProgress-barColorSecondary MuiLinearProgress-bar1Determinate css-14usnx9" style="width:${karmaval}%";>
        </span>
        </span>

        </font>`;
for (var i = 0; i < list.length; i++) {
  temp = ns.scan(list[i]);
  for (var j = 0; j < temp.length; j++) {
    if (!list.includes(temp[j])) { list.push(temp[j]) }
  }
}
let list1 = list.filter(item => item !== "home")
/*---------------------Sorting---------------------*/
while (list1.length > 0) {
  temp3 = order[order.length - 1];
  temp2 = [];
  for (i = 0; i < list1.length; i++) {
    for (j = 0; j < temp3.length; j++) {
      if (ns.scan(list1[i]).includes(temp3[j])) {
        temp2.push(list1[i]);
      }
    }
  }
  order.push(temp2);
  temp3 = order[order.length - 1];
  for (i = 0; i < list1.length; i++) {
    if (temp3.includes(list1[i])) {
      list1 = list1.filter(item => item !== list1[i]);
      i--;
    }

  }
}
/*---------------------Depthmarking---------------------*/
for (i = 0; i < order.length; i++) {
  depthchart += "|" + i + "," + order[i].toString();
}
let depthlist = depthchart.split("|");
depthlist.shift();
for (i = 0; i < depthlist.length; i++) {
  depthlist[i] = depthlist[i].split(",");
}
/*---------------------Build interface---------------------*/
for (i = 0; i < list.length; i++) {
  let name = list[i];
  let maxram = ns.getServerMaxRam(name);

  let spacer = "-";
  let spacer2 = "-";
  let depth = 0;
  for (j = 0; j < depthlist.length; j++) {
    if (depthlist[j].includes(list[i])) {
      depth = depthlist[j][0];
    }
  }
  /*---------------------Build path for autoconnect---------------------*/
  let steps = [list[i]];
  while (depth > 0) {
    depth--
    for (j = 0; j < steps.length; j++) {
      let temp = ns.scan(steps[j]);
      for (let k = 0; k < temp.length; k++) {
        if (depthlist[depth].includes(temp[k])) {
          steps.push(temp[k]);
          k = temp.length;
        }
      }
    }
  }
  steps.reverse();
  let goto = ""
  for (j = 0; j < steps.length; j++) {
    goto += ";connect " + steps[j];
  }
  goto += ";cls";
  /*---------------------Set colours for names, as a result of security level---------------------*/
  let hackColor = ns.hasRootAccess(name) ? "lime" : "red";
  let nameColor = facServers[name] ? facServers[name] : "darkRed";
  let ratio = ns.getServerSecurityLevel(name) / ns.getServerMinSecurityLevel(name);
  if (nameColor != "cyan") {
    if (ratio > 3) {
      nameColor = "#FF0000";
    }
    else if (ratio >= 2) {
      nameColor = "#FF" + Math.round(255 - 255 * (ratio - 2)).toString(16) + "00";
      if (nameColor.length == 6) {
        nameColor = "#FF0" + nameColor.substring(3);
      }
    }
    else if (ratio > 1.05) {
      nameColor = "#" + Math.round(255 * (ratio - 1)).toString(16) + "FF00";
      if (nameColor.length == 6) {
        nameColor = "#0" + nameColor.substring(1);
      }
    }

    else if (ratio <= 1.05) {
      nameColor = "lime";
    }
  }
  if (nameColor.length == 6) {
    nameColor = "#0" + nameColor.substring(1);
  }
  if (ns.getServerRequiredHackingLevel(name) > ns.getHackingLevel()) {
    nameColor = "darkRed"
  }
  let monratio = ns.getServerMoneyAvailable(name) / ns.getServerMaxMoney(name);
  let money = ""
  if (Math.round(100 * monratio) != 'Infinity') {
    if (Math.round(100 * monratio) == 100) {
      money += ns.formatNumber(ns.getServerMoneyAvailable(name)) + " (" + Math.round(100 * monratio) + "%)";
    }
    else if (Math.round(100 * monratio) >= 10) {
      money += ns.formatNumber(ns.getServerMoneyAvailable(name)) + " ( " + Math.round(100 * monratio) + "%)";
    }
    else if (Math.round(100 * monratio) >= 0) {
      money += ns.formatNumber(ns.getServerMoneyAvailable(name)) + " ( " + Math.round(100 * monratio) + " %)";
    }
  }
  else { money += ns.formatNumber(ns.getServerMoneyAvailable(name)) + " ( ∞ %)"; }
  let moneyColor = "#FF0000";
  if (monratio >= 0.5) {
    moneyColor = "#FF" + Math.round(255 * ((monratio - 0.5) / 0.9)).toString(16) + "00";
    if (moneyColor.length == 6) {
      moneyColor = "#FF0" + moneyColor.substring(3);
    }
  }
  if (monratio > 0.9) {
    moneyColor = "#" + Math.round(255 - (255 * (monratio - 0.9))).toString(16) + "FF00";
    if (moneyColor.length == 6) {
      moneyColor = "#0" + moneyColor.substring(1);
    }
  }
  if (monratio > 0.99) {
    moneyColor = "lime";
  }
  /*---------------------Set Hover text for current link---------------------*/
  let hoverText = "Req Level: " + ns.getServerRequiredHackingLevel(name) +
    "&#10;Req Ports: " + ns.getServerNumPortsRequired(name) +
    "&#10;Memory: " + ns.getServerMaxRam(name) + "GB" +
    "&#10;Security: " + ns.getServerSecurityLevel(name) + "/" + ns.getServerMinSecurityLevel(name) +
    "&#10;Money: " + money;
  let ctText = "";
  tempfiles = ns.ls(name, ".cct");
  for (j = 0; j < tempfiles.length; j++) {
    ctText += `<a class="cctlink" title="` + tempfiles[j] +
      //Comment out the next line to reduce footprint by 5 GB
      `'&#10;'` + ns.codingcontract.getContractType(tempfiles[j], name) + '"' +
      `onClick="(function()
                  {
                      const terminalInput = document.getElementById('terminal-input');
                      terminalInput.value='${goto};${tempfiles[j]};home';
                      const handler = Object.keys(terminalInput)[1];
                      terminalInput[handler].onChange({target:terminalInput});
                      terminalInput[handler].onKeyDown({key:'Enter',preventDefault:()=>null});
                  })();"
                  
                  >©</a>`;
  }

  /*---------------------Spacers---------------------*/
  while ((name.length + spacer.length + tempfiles.length + money.length) < 35) {
    spacer += "-";
  }
  while ((name.length + spacer.length + tempfiles.length + money.length + spacer2.length + maxram.length) < 45) {
    spacer2 += "-";
  }
  spacer2 = "-"
  if (maxram > 1000) {
    maxram = maxram / 1024;
    ramsuffix = " TB";
    ramColor = "lime";
  }
  else if (maxram == 0) {
    ramColor = "darkRed";
  }
  else {
    ramsuffix = " GB";
    ramColor = "cyan";
  }
  let exceptions = ns.getPurchasedServers();
  exceptions += "darkweb"
  if (!exceptions.includes(name)) {
    output += '<br>' + `<tt>----<font color=${hackColor}>■ </font>` +
      `<a class='scan-link' title='${hoverText}'
              onClick="(function()
                  {
                      const terminalInput = document.getElementById('terminal-input');
                      terminalInput.value='${goto}';                  
                      const handler = Object.keys(terminalInput)[1];
                      terminalInput[handler].onChange({target:terminalInput});
                      terminalInput[handler].onKeyDown({key:'Enter',preventDefault:()=>null});
                  })();"
                 onMouseover="(function()
                  {
                      const terminalInput = document.getElementById('terminal-input');
                      terminalInput.value='1';
                      const handler = Object.keys(terminalInput)[1];
                  })();"
                  onMouseleave="(function()
                  {
                      const terminalInput = document.getElementById('terminal-input');
                      terminalInput.value='';
                      const handler = Object.keys(terminalInput)[1];
                  })();"
                  
                  style='color:${nameColor};'>${name}</a> ` +
      `<font color='fuchisa'>${ctText}</font>` + `<font color="black">${spacer}</font>` +
      `<font color='${moneyColor}'>${money}</font><font color="black">${spacer2}</font>` +
      `<font color='${ramColor}'>${maxram}${ramsuffix}</font></tt>`;
  }
}
try {
  const terminalInput = doc.getElementById('terminal-input');
  while (terminalInput.value.includes('1')) {
    await ns.sleep(100)
  }
}catch{}
try {
  const HUDElement = doc.getElementById("root").firstChild.nextSibling.firstChild.nextSibling.firstChild;

  if (HUDElement.firstChild.innerHTML.includes('<li')) {
    try {
      const lista = doc.getElementById("hook");
      lista.innerHTML = output;
    }
    catch {
      HUDElement.insertAdjacentHTML('beforeEnd', `<ul class="MuiList-root Mui-Paper-elevation MuiPaper-elevation1 react-draggable jss26 MuiList-padding css-1ontqvh" 
                  style="width:35%; max-height: 1024px;  overflow-y: scroll; overflow-x: scroll;"><ul class="MuiList-root jss26 MuiList-padding css-1ontqvh" 
                  style="width:100%;  overflow-y: scroll; overflow-x: scroll;" id="hook"></ul></ul>`)
      const lista = doc.getElementById("hook");
      lista.innerHTML = output;
    }
  }
}catch { }
  }
}