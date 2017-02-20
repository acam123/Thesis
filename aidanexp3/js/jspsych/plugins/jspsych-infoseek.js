/*
This is the main plugin that controls the flow of the experiment
*/

(function($) {
jsPsych.infoseek = (function(){

  var plugin = {};
  var trial_num = 0;

plugin.create = function(params) {
    var trials = new Array(params.isPractice.length);
    for (var i = 0; i < trials.length; i++) {
        trials[i] = {};
        trials[i].isPractice = params.isPractice[i];
        trials[i].color_scheme = params.color_scheme[i]; // formerly used to randomize color presentation    
        trials[i].ss_side = params.ss_side[i];
        trials[i].cal = params.cal[i];   
        trials[i].left_key = params.left_key || 70; // defaults to 'f'
        trials[i].right_key = params.right_key || 71; // defaults to 'g'
        trials[i].iti = params.iti[i]; //formerly used to randomize iti time
    }
    return trials;
};

plugin.trial = function(display_element, trial){
    var ITI = trial.iti;
    var trial_timeout = 6500; // formerly used to limit length of stimulus presentation
    var ss_pos = 0; // keeps track of ss day option
    var ll_pos = 0; // keeps track of ll day option
    var timeout; // formerly used to add a timeout on practice trials
    var color_left;
    var color_right;
    var row_length = 10; // shape of calendar 
    var no_response_wait = 10000; 
    var practice_relsults_time = 10000; // time for practice trial result presentation

    // Color Handling
    colors = {a:'#6cff00', b:'#00fdff'};
    
    if (trial.color_scheme == 1) {
      color_left = colors.a;
      color_right = colors.b;
    }
    else if (trial.color_scheme == 2) {
      color_left = colors.b;
      color_right = colors.a;
    }

    // Initiate Trial Variables
    var trial_data = {};
      trial_data.isPractice = trial.isPractice;
      trial_data.color_scheme = trial.color_scheme;  
      trial_data.ss_side = trial.ss_side;
      trial_data.cal = trial.cal;
      trial_data.iti = trial.iti;
      trial_data.trial_timeout = trial_timeout;
      trial_data.version = 300; 

      
    function get(name) {
      if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
      } //courtesy StackOverflow user Rafael http://stackoverflow.com/questions/831030/how-to-get-get-request-parameters-in-javascript
      var workerID = get('workerID');
      trial_data.workerID = workerID;

    // Text for Calnedar Corners
    function time_text(i) {
      var tt;
      if (i == 0) {
        tt = 'Today';
      }
      else if (i == 1) {
        tt = '1 Week';
      }
      else {
        tt = i+' Weeks';
      }
      return tt;
    }

    // Grammar Correction Wrapper for Practice Result  
    function time_text_2(i) {
      if (i == 0) {
        tt = time_text(i);
      }
      else {
        tt = 'in ' +time_text(i);
      }
      return tt;
    }

    // Generate Calendar Stimuli  
    function choice(){
        //Display each option
        len = trial.cal.length; 

        top_string = '<div class="key_wrap"> <span style="color:'+ color_left +';" class="key_left">\' f \'</span> <span style="color:'+ color_right +';"class="key_right">\' g \'</span> </div><br></br>';

        bill_cal = '<div id="bill_txt"><table id="bill_cal" class="cal-table">';
        for (var i = 0; i < len; i++) {    
            // handle cells 
            function cell_content() {
              if (trial.cal[i].typ == 'b') {
                b_pos = i;
                trial_data.b_week = b_pos;
                trial_data.b_val = trial.cal[i].val;
                return '<td class="bill_cell"><div class="cell_wrap"><span class="cell_val">-$'+ Math.abs(trial.cal[i].val).toString() +'</span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
              }
              else if (trial.cal[i].typ == 'ss') {
                ss_pos = i;
                trial_data.ss_week = ss_pos;
                trial_data.ss_val = trial.cal[i].val
            
                if (trial.ss_side == 1){
                  ss_color = color_left;
                }
                else {
                  ss_color = color_right;
                }

                return '<td class="ss_cell" style="border-color:'+color_left+';"><div class="cell_wrap"><span class="cell_val" style="color:'+color_left+'; ">$'+ trial.cal[i].val.toString() +'</span><span class="cal_nums">'+time_text(i);+'</span></div></td>'; 
              }
              else if (trial.cal[i].typ == 'll') {
                ll_pos = i;
                trial_data.ll_week = ll_pos;
                trial_data.ll_val = trial.cal[i].val;
        
                if (trial.ss_side == 1){
                  ll_color = color_right;
                }
                else {
                  ll_color = color_left;
                }
          
                return '<td class="ll_cell" style="border-color:'+color_right+';"><div class="cell_wrap"><span class="cell_val" style="color:'+color_right+';">$'+ trial.cal[i].val.toString() +'</span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
              }
              else if (trial.cal[i].typ == 'empty') {
                return '<td class="bill_cell"><div class="cell_wrap"><span class="cell_val"></span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
              }
              else {
                return '<td><span class="cal_nums">'+time_text(i);+'</span>Err<div class="cell_val"></div></td>';
              } 
            }

            // handle rows 
            if (i % row_length == 0) {
              bill_cal += '<tr>' + cell_content()
            }
            else if (i % (row_length) == 9) {
              bill_cal += cell_content() + '</tr>'
            }
            else {
              bill_cal += cell_content()
            }  
        };
        bill_cal += '</table></div>';

        display_element.append($('<div>', {
              "class": 'jspsych-infoseek-stimulus center-content',
              html: top_string
          }));

        display_element.append($('<div>', {
              html: bill_cal
          }));

      /*
      // UNCOMMENT FOR TIMEOUT!!! 
      time_content1 = '';
      cur_time1 = 6;
      display_element.append($('<div>', {
            "id": 'timer1',
            "class": 'jspsych-infoseek-stimulus center-content',
            html: time_content1  
          }));
      display1 = document.querySelector('#timer1');
      startTimer1(cur_time1, display1);

      function startTimer1(cur_time1, display1) {
        timer1 = setInterval(function () {
            display1.textContent = cur_time1;
            if(cur_time1 <= 0) {
              $("#timer1").remove();
              clearTimeout(timer1);
              time_complete();
            }
            cur_time1 = cur_time1 - 1;
        }, 1000);
      }
      */

       jsPsych.pluginAPI.getKeyboardResponse({
              callback_function: key_complete,
              valid_responses: [trial.left_key, trial.right_key],
              rt_method: 'date',
              persist: false,
              allow_held_key: false
          });
 
    }

    var key_complete = function(info) {
      clearTimeout(timeout);
      //UNCOMMENT FOR TIMEOUT
      // clearTimeout(timer1);

      //clean up choice screen   
      $("#bill_txt").remove();
      $('.jspsych-infoseek-stimulus').remove();
      complete(info);
    }

    
    // UNCOMMENT FOR TIMEOUT!!! 
    /*
    var time_complete = function() {
      var info = {key:-1};
      jsPsych.pluginAPI.cancelAllKeyboardResponses();
      //clean up choice screen   
      $("#bill_txt").remove();
      $('.jspsych-infoseek-stimulus').remove();
      countdown(info);
    } 
    
    function showBlankScreen() {
        display_element.html('');
    }
    */
      
    function save_data(data){
       var data_table = "aidan_table"; // change this for different experiments
       $.ajax({
          type:'post',
          cache: false,
          url: 'savedata.php',
          // opt_data is to add additional values to every row, like a subject ID
          // replace 'key' with the column name, and 'value' with the value.
          data: {
              table: data_table,
              json: JSON.stringify(data),
           //   opt_data: {isPractice: 42}
          },
          success: function(output) { console.log(output); } // write the result to javascript console
       });
    }
      
    // UNCOMMENT FOR TIMEOUT!!! 
    /*
    function remove_countdown(info) {
      $("#countdown").remove();
      $("#next-button").remove();
    }
    */

    function next_button(info) {
      button_text = '<br><button>Next ></button>';
      display_element.append($('<div>', {
        "id": 'next-button',
        "class": 'jspsych-infoseek-stimulus center-content',
        html: button_text
      }));

      $("#next-button").click(function() {
        display_element.html('');
        remove_countdown(info);
      });
    }


    // UNCOMMENT FOR TIMEOUT!!! 
    /*
    function startTimer(cur_time, display, info) {
        timer = setInterval(function () {
            display.textContent = cur_time;
            if(cur_time <= 0) {
              $("#timer").remove();
              next_button(info);
              clearTimeout(timer);
            }
            cur_time = cur_time - 1;
        }, 1000);
    }

    function countdown(info) {
      wait_text = 'You failed to make a selection in time<br>You will now have to wait before going to the next trial';
      display_element.append($('<div>', {
        "id": 'countdown',
        "class": 'jspsych-infoseek-stimulus center-content',
        html: wait_text
      }));

      time_content = '';
      cur_time = 10
      display_element.append($('<div>', {
            "id": 'timer',
            "class": 'jspsych-infoseek-stimulus center-content',
            html: time_content  
          }));
      display = document.querySelector('#timer');
      startTimer(cur_time, display, info);
    }
    */
      
    var complete = function(info) {
        //Handle non response trials
        ITI_text = 'The next trial will start in a moment';
        if (info.key == -1 ) {
          display_iti();
        }
        else {
          trial_data.rt = info.rt;
          chosen = info.key;

        //FOR RANDOM SS SIDE ASSIGNMENTS, DEFINE CHOSE_SS 
        //  chose_ss = ((trial.ss_side == 1) && (chosen == trial.left_key)) || ((trial.ss_side == 2) && (chosen == trial.right_key));
      

        //FOR LEFT-SS RIGHT-LL ASSIGNMENTS, DEFINE CHOSE_SS 
        chose_ss = (chosen == trial.left_key);

          // 0 is ss
          if (chose_ss) {
            trial_data.chosen = 0;
          }
          else {
            trial_data.chosen = 1;
          }
            
          if (trial.isPractice == 0) {
            if (info.key != -1) {
              display_iti();
            }
          }
          else if (trial.isPractice == 1) { // GENERATE RESPONSE CALENDAR AND TEXT FOR PRACTICE TRIALS
           // ITI_text = '';
            len = trial.cal.length; 
            balance = 0;
            fines = 0;
            fine_val = .1;
            bill_val = 0;
            bill_delay = 0;
            ll_delay = 0;
            bills = 0;
            practice_text = '<div id="bill_txt">This shows your balance at the end of each week in which it changed<br></br><table id="bill_cal" class="cal-table">';

            for (var i = 0; i < len; i++) {    
                // update balance for timestep   
                if (trial.cal[i].typ == 'ss' && chose_ss) { //if ss box and ss was chosen 
                  balance += parseInt(trial.cal[i].val);
                }
                else if (trial.cal[i].typ == 'll' && (!chose_ss)) { //if ll box and ll was chosen 
                  balance += parseInt(trial.cal[i].val);
                  ll_delay = i;
                }
                else if (trial.cal[i].typ == 'b') {
                  balance += parseInt(trial.cal[i].val);
                  bill_val = trial.cal[i].val
                  bill_delay = i;
                  bills += 1;
                  if (balance < 0) {
                    fines += 1;
                    balance += bill_val*fine_val;
                  }
                } 
                else if (trial.cal[i].typ == 'empty') {
                  if ((fines > 0) && (balance < 0)) {
                    balance += bill_val*fine_val
                  }
                }

                // set color for balance text
                if (balance < 0) {
                  balance_color = 'red';
                }
                else {
                  balance_color = 'black';
                }
                
                // handle cells 
                function cell_content() {
                  if (trial.cal[i].typ == 'b') {
                    if (chose_ss) {
                      return '<td class="bill_cell" style="border-color:red"><div class="cell_wrap"><span class="cell_val" style="color:'+balance_color+';">'+balance+'</span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
                    }
                    else {
                      return '<td><div class="cell_wrap"><span class="cell_val"></span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
                    }
                  }
                  else if (trial.cal[i].typ == 'ss') {
                    ss_pos = i;

                    if (trial.ss_side == 1){
                      ss_color = color_left;
                    }
                    else {
                      ss_color = color_right;
                    }

                    if (chose_ss) {
                      return '<td class="ss_cell" style="border-color:'+color_left+';"><div class="cell_wrap"><span class="cell_val" style="color:'+balance_color+';">'+balance+'</span><span class="cal_nums">'+time_text(i);+'</span></div></td>'; 
                    }
                    else {
                      return '<td><div class="cell_wrap"><span class="cell_val"></span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
                    }
                  }
                  else if (trial.cal[i].typ == 'll') {
                    ll_pos = i;

                    if (trial.ss_side == 1){
                      ll_color = color_right;
                    }
                    else {
                      ll_color = color_left;
                    }

                    if (chose_ss) {
                      return '<td><div class="cell_wrap"><span class="cell_val"></span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
                    }
                    else {
                      return '<td class="ll_cell" style="border-color:'+color_right+';"><div class="cell_wrap"><span class="cell_val" style="color:'+balance_color+';">'+balance+'</span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
                    }
                  }
                  else if (trial.cal[i].typ == 'empty') {
                    return '<td><div class="cell_wrap"><span class="cell_val"></span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
                  }
                  else {
                    return '<td><div class="cell_wrap"><span class="cell_val">Err!!!</span><span class="cal_nums">'+time_text(i);+'</span></div></td>';
                  } 
                }
                
                // handle rows 
                if (i % row_length == 0) {
                  practice_text += '<tr>' + cell_content()
                }
                else if (i % (row_length) == 9) {
                  practice_text += cell_content() + '</tr>'
                } 
                else {
                  practice_text += cell_content()
                }  
            }; // end of for loop

            practice_text += '</table></div>'; 

            if (chose_ss) {
              rew_val = trial.cal[ss_pos].val;
              rew_week = ss_pos;
            }
            else {
              rew_val = trial.cal[ll_pos].val;
              rew_week = ll_pos;
            }

            if (chosen == trial.left_key) {
              rew_color = color_left;
            }
            else {
              rew_color = color_right;
            }

            practice_text += 'You chose to get $<font color="'+rew_color+'">'+rew_val+'<font color="black"> '+time_text_2(rew_week);
            practice_text +='<br> You had to pay <font color="red">'+bills+' <font color="black">bill(s)'
            if (bills > 0) {
               practice_text += ' worth $<font color="red">'+Math.abs(bill_val)
            }
            if (fines > 0) { 
              practice_text +='<br> <font color="black">You had insufficient funds when your bill was due <br>You paid your bill <font color="red">'+(ll_delay - bill_delay)+' <font color="black">week(s) late, and were fined an additional $<font color="red">'+Math.round((bill_delay - ll_delay)*fine_val*bill_val)+'<font color="black"> in penalty fees'
            }
            else {
                practice_text +='<br> <font color="black">You were fined an additional $<font color="red">0 <font color="black">in penalty fees'
            }
            display_element.append($('<div>', {
              "class": 'jspsych-infoseek-stimulus center-content',
              "id": 'practice_results',
              html: practice_text
            }));

            function remove_result_cal() {
              $("#practice_results").remove();
              display_iti();
            } 

            next_button(info);

            $("#next-button").click(function() {
              display_element.html('');
              $("#next-button").remove();
              remove_result_cal();
            });

          } // end of if isPractice

        } // end of if key == -1 

        function display_iti() {
          display_element.append($('<div>', {
            "class": 'jspsych-infoseek-stimulus center-content',
            "id": 'ITI_text',
            html: ITI_text
          }));

          function remove_iti() {
            $("#ITI_text").remove();
            jsPsych.finishTrial();
          } 

          setTimeout(function() {
            remove_iti();
          }, ITI);
        }
      
        //Trial specific number in meta of cal [0]/ss 
        trial_data.cal = trial.cal[0].meta;

        trial_data.trial_num = trial_num;
        save_data([trial_data]);
    } 

    trial_num += 1;
    choice(); 
  } 
  
  return plugin;

})();
})(jQuery);
