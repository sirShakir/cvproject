    //- function intervalFunc() {
    //-   socket.emit('newPlayer', x );
    //- }setInterval(intervalFunc,300);
var modes = [true,false,false];
var md_footer = document.getElementById("controls_MD");
var od_footer = document.getElementById("controls_OD");
var rd_footer = document.getElementById("controls_RD");
function activate_MD(){
    socket.emit('md_Activate');
    console.log("this was called")
}
function deactivate_MD(){
    socket.emit('md_Dectivate');
}
function activate_OD(){
    socket.emit('od_Activate');
    console.log("this was called")
}
function deactivate_OD(){
    socket.emit('od_Dectivate');
}

function swtich_Modes(mode_num){
    switch(mode_num) {
        case 1:
            modes[0] = true;
            modes[1] = false;
            modes[2] = false;
            md_footer.style.display = "block";
            od_footer.style.display = "none";
            rd_footer.style.display = "none";
          break;
        case 2:
            modes[0] = false;
            modes[1] = true;
            modes[2] = false;
            md_footer.style.display = "none";
            od_footer.style.display = "block";
            rd_footer.style.display = "none";
          break;
        case 3:
            modes[0] = false;
            modes[1] = false;
            modes[2] = true;
            md_footer.style.display = "none";
            od_footer.style.display = "none";
            rd_footer.style.display = "block";
          break;
    }
    socket.emit('mode_switch', mode_num);
}
function update_Threshold(){
 let thresh_value = document.getElementById("threshold").value;
 socket.emit('update_thresh', thresh_value);
}
function update_Sensitivity(){
    let sensitivity_value = document.getElementById("sensitivity").value;
    socket.emit('update_sensitivity', sensitivity_value);
}