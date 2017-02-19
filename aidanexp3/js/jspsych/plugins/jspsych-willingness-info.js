(function($) {
jsPsych.infoseek = (function(){

  var plugin = {};

plugin.create = function(params) {

    var trials = new Array(params.isPractice.length);
    for (var i = 0; i < trials.length; i++) {
        trials[i] = {};
        trials[i].isPractice = params.isPractice[i];
        
        trials[i].info_side = params.info_side[i];
        trials[i].info_rew = params.info_rew[i];
        trials[i].info_prob = params.info_prob[i];

        trials[i].noinfo_rew = params.noinfo_rew[i];
        trials[i].noinfo_prob = params.noinfo_prob[i];
        
        trials[i].left_key = params.left_key || 81; // defaults to 'q'
        trials[i].right_key = params.right_key || 80; // defaults to 'p'
        // timing parameters
        trials[i].timing_delay = params.timing_delay || 10000; // defaults to 10000msec.
        trials[i].timing_choice = params.timing_choice || -1; // defaults to -1, meaning infinite time on choice
        trials[i].timing_display = params.timing_display || 5000; //time for outcome display, defaults to 5000msec
        trials[i].timing_numbers = params.timing_numbers || 2000; //time for number display, defaults to 2000msec
        
        trials[i].base_bonus = params.base_bonus || 2; //base bonus, this will change based on gamble chosen/outcome
        
        trials[i].nums = params.nums[i];
        trials[i].num_nums = params.num_nums[i];
        trials[i].nums_secs = params.nums_secs[i];
    }
    return trials;
};

  plugin.trial = function(display_element, trial){
    
    var trial_data = {};
      
      trial_data.isPractice = trial.isPractice;
      
      trial_data.info_side = trial.info_side;
      trial_data.info_rew = trial.info_rew;
      trial_data.info_prob = trial.info_prob;
      
      trial_data.noinfo_rew = trial.noinfo_rew;
      trial_data.noinfo_prob = trial.noinfo_prob;
      
      trial_data.timing_delay = trial.timing_delay;
      trial_data.timing_choice = trial.timing_choice;
      trial_data.timing_display = trial.timing_display;
      trial_data.timing_numbers = trial.timing_numbers;
      
      trial_data.base_bonus = trial.base_bonus;
      
      trial_data.nums = trial.nums.toString();
      trial_data.num_nums = trial.num_nums;
      trial_data.nums_secs = trial.nums_secs.toString();
      
              function get(name) {
            if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
                return decodeURIComponent(name[1]);
        } //courtesy StackOverflow user Rafael http://stackoverflow.com/questions/831030/how-to-get-get-request-parameters-in-javascript

        var workerID = get('workerID');
      
      trial_data.workerID = workerID;
      
    function choice(){
        //Display each option
        if(trial.info_rew > 0){
            info_string = ['<font color="green">A ' + (trial.info_prob*100).toString() + '% chance to <b>gain $' + trial.info_rew.toFixed(2) + '</b><br>'];
        } else{
            info_string = ['<font color="green">A ' + (trial.info_prob*100).toString() + '% chance to <b>lose $' + (-1*trial.info_rew).toFixed(2) + '</b><br>'];
        }
        info_string = [info_string + 'You will be shown the outcome <b>immediately</b></font>'];
        
        if(trial.noinfo_rew > 0){
            noinfo_string = ['<font color="blue">A ' + (trial.noinfo_prob*100).toString() + '% chance to <b>gain $' + trial.noinfo_rew.toFixed(2) + '</b><br>'];
        } else{
            noinfo_string = ['<font color="blue">A ' + (trial.noinfo_prob*100).toString() + '% chance to <b>lose $' + (-1*trial.noinfo_rew).toFixed(2) + '</b><br>'];
        }
        noinfo_string = [noinfo_string + 'You will be shown the outcome <b>after a delay</b></font>'];
        
        if(trial.info_side == 1){
            left_string = info_string;
            right_string = noinfo_string;
        }else{
            right_string = info_string;
            left_string = noinfo_string;
        }
        left_string = [left_string + '<br>Press the \'q\' key to choose this option'];
        right_string = [right_string + '<br>Press the \'p\' key to choose this option'];
        display_element.append($('<div>', {
                "class": 'jspsych-infoseek-stimulus left',
                html: left_string
            }));
        display_element.append($('<div>', {
                "class": 'jspsych-infoseek-stimulus right',
                html: right_string
            }));
        
//        display_element('<div align=right>bope bope bope</div>');
                
        jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_choice,
          valid_responses: [trial.left_key, trial.right_key],
          rt_method: 'date',
          persist: false,
          allow_held_key: false
        });
    }
      
    var after_choice = function(info) {
        //clear the screen
        $('.jspsych-infoseek-stimulus').remove();
        chosen = info.key;
        trial_data.choice_rt = info.rt;
        chose_left = (chosen == trial.left_key);
        if((chose_left && trial.info_side == 1) || (chose_left==0 && trial.info_side ==2)){
            info = 1;
            success = Math.random() < trial.info_prob;
            outcome = success*trial.info_rew;
            gain_frame = trial.info_rew > 0;
        }else{
            info = 0;
            success = Math.random() < trial.noinfo_prob;
            outcome = success*trial.noinfo_rew;
            gain_frame = trial.noinfo_rew > 0;
        }
        trial_data.chose_left = chose_left;
        trial_data.chose_info = info;
        trial_data.success = success;
        trial_data.outcome = outcome;
            
        if(info == 1){
            //display outcome, then delay, then finish trial
            display_outcome(number_game);
        } else{
            //delay, then display outcome, then finish trial
            number_game(display_outcome);
        }
    }
      
    function number_game(funct) {
        funct = typeof funct !== 'undefined' ? funct : complete;
        $('.jspsych-infoseek-stimulus').remove();
        display_element.append($('<div>', {
            "class": 'jspsych-infoseek-stimulus center-content',
            html: ['This is the delay<br>A number may appear at any time. Remember the most recent number']
        }));      
        
        nums = trial.nums;
        nums_secs = trial.nums_secs;
        
        cur_time = nums_secs.shift();
        
        setTimeout(function() {
            disp_num(funct,nums, nums_secs, cur_time);
        }, cur_time*1000);        
    }
        
    function disp_num(funct, nums, nums_secs, cur_time){
        cur_num = nums.shift();
        cur_time = cur_time + 2;
          
        display_element.append($('<div>', {
            "class": 'jspsych-infoseek-num center-content',
            html: cur_num
        }));
          
        setTimeout(function() {
            rem_num(funct,nums,nums_secs,cur_time);
        }, 2000);
    }
                
    function rem_num(funct, nums, nums_secs, cur_time){
        
        $('.jspsych-infoseek-num').remove();
        if(nums_secs.length > 0){
            time = nums_secs.shift();
            setTimeout(function() {
                disp_num(funct,nums,nums_secs,time);
            }, (time - cur_time)*1000);
        }else{
            time = (trial.timing_delay)/1000;
            setTimeout(function() {
                number_input(funct);
            }, (time - cur_time)*1000);
        }
    }
      
      
      function number_input(funct){
          $('.jspsych-infoseek-stimulus').remove();
          
 // add question text
          question = 'What was the last number that you saw? (Enter 1-9)';
        display_element.append($('<div>', {
            "class": 'jspsych-infoseek-stimulus',
            html: [question]
        }));    

        // add text box
        display_element.append('<textarea id="focus" class="#jspsych-infoseek-text-response" name="#jspsych-infoseek-text-response center-content" cols="10" rows="1"></textarea>');
          document.getElementById("focus").focus();
          var startTime = (new Date()).getTime();
      // add submit button
      display_element.append($('<button>', {
        'id': 'jspsych-infoseek-text-next',
        'class': 'jspsych-infoseek-text right'
      }));
      $("#jspsych-infoseek-text-next").html('Submit Answer');
      $("#jspsych-infoseek-text-next").click(function() {
        // measure response time
        var endTime = (new Date()).getTime();
        var response_time = endTime - startTime;

    trial_data.num_answer = $('#focus').val();
                    
        display_element.html('');
        funct();
      });
      }
                                           
      
    function display_outcome(funct) {
        funct = typeof funct !== 'undefined' ? funct : complete;
        $('.jspsych-infoseek-stimulus').remove();
      if(success == 1){
        if(outcome > 0) {
            display_element.append($('<div>', {
                "class": 'jspsych-infoseek-stimulus center-content',
                html: ['You won $' + outcome.toFixed(2) + '!']
            }));      
        }else {
            display_element.append($('<div>', {
                "class": 'jspsych-infoseek-stimulus center-content',
                html: ['You lost $' + (outcome*(-1)).toFixed(2) + '!']
            })); 
        }
      }else if(gain_frame == 1){
            display_element.append($('<div>', {
                "class": 'jspsych-infoseek-stimulus center-content',
                html: ['Sorry, you did not win']
            })); 
      }else{
          display_element.append($('<div>', {
                "class": 'jspsych-infoseek-stimulus center-content',
                html: ['Hurrah! You will not lose money']
            })); 
      }
            display_element.append($('<div>', {
                "class": 'jspsych-infoseek-stimulus center-content',
                html: ['If this trial is chosen for the payoff, you will earn a $' + (trial.base_bonus + outcome).toFixed(2) + ' bonus']
            })); 
        setTimeout(function() {
                funct();
            }, trial.timing_display);  
    } 
    
    function showBlankScreen() {
        display_element.html('');
    }
      
    function save_data(data){
   var data_table = "tommy_table"; // change this for different experiments
   $.ajax({
      type:'post',
      cache: false,
      url: 'save_data.php',
      // opt_data is to add additional values to every row, like a subject ID
      // replace 'key' with the column name, and 'value' with the value.
      data: {
          table: data_table,
          json: JSON.stringify(data)//,
          //opt_data: {key: value}
      },
      success: function(output) { console.log(output); } // write the result to javascript console
   });
}
      
    function complete(){
        $('.jspsych-infoseek-stimulus').remove();
        
        save_data([trial_data]);
        jsPsych.finishTrial();
    }
    
      choice(); 
  }

  
  
  return plugin;

})();
})(jQuery);