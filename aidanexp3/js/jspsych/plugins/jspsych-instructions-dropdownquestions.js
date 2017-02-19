/* This plugin displays text (including HTML formatted strings) during the experiment.
 * Then it displays a survey, and allows navigation back to the instructions
 */

(function($) {
  jsPsych['survey-dropdown'] = (function() {

    var plugin = {};

    plugin.create = function(params) {

      //params = jsPsych.pluginAPI.enforceArray(params, ['data']);

      var trials = [];
      for (var i = 0; i < params.questions.length; i++) {
        var rows = [], cols = [];
        if(typeof params.rows == 'undefined' || typeof params.columns == 'undefined'){
          for(var j = 0; j < params.questions[i].length; j++){
            cols.push(40);
            rows.push(1);
          }
        }

        trials.push({
          instructions: params.instructions,
          preamble: typeof params.preamble == 'undefined' ? "" : params.preamble[i],
          questions: params.questions[i],
          answers: params.answers[i],
          rows: typeof params.rows == 'undefined' ? rows : params.rows[i],
          columns: typeof params.columns == 'undefined' ? cols : params.columns[i]
        });
      }
      return trials;
    };

    plugin.trial = function(display_element, trial) {

      // if any trial variables are functions
      // this evaluates the function and replaces
      // it with the output of the function
      trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

        function instructions(){
            display_element.html(trial.instructions);
            var nav_html = "<div class='jspsych-instructions-nav'>";
            nav_html += "<button id='jspsych-instructions-next'>Next &gt;</button></div>"
            display_element.append(nav_html);
            $('#jspsych-instructions-next').on('click', function() {
            clear_button_handlers();
            survey();
          });
        }

     function clear_button_handlers() {
        $('#jspsych-instructions-next').off('click');
        $('#jspsych-instructions-back').off('click');
      }
       
    function survey(){
      display_element.html('');
      // show preamble text
      display_element.append($('<div>', {
        "id": 'jspsych-survey-likert-preamble',
        "class": 'jspsych-survey-likert-preamble'
      }));

    function save_data(data){
      var data_table = "aidan_table_2"; // change this for different experiments
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

    var trial_data = {};

      $('#jspsych-survey-likert-preamble').html(trial.preamble);

     

      // add questions
      for (var i = 0; i < trial.questions.length; i++) {
        // create div
        answers = trial.answers[i];

        display_element.append($('<div>', {
          "id": 'jspsych-survey-text-' + i,
          "class": 'jspsych-survey-text-question'
        }));

        // add question text
        $("#jspsych-survey-text-" + i).append('<p class="jspsych-survey-text">' + trial.questions[i] + '</p>');

        var ans = "";
        for (k = 0; k < answers.length; k++){
          ans += "<option value='" + k + "'>" + answers[k] + "</option>"
        }
        // add text box
        $("#jspsych-survey-text-" + i).append('<select id="jspsych-survey-text-response-' + i + '">' + ans + '</select>');

      }

        var nav_html = "<div class='jspsych-instructions-nav'>";
      //  nav_html += "<button id='jspsych-instructions-back'>&lt; Back to instructions</button>";
        nav_html += "<button id='jspsych-instructions-next'>Submit Answers &gt;</button></div>"
        display_element.append(nav_html);

      $("#jspsych-instructions-next").click(function() {
        // measure response time
        // create object to hold responses
        var question_data = [];
        for (var i = 0; i < trial.questions.length; i++) {
          question_data.push($('#jspsych-survey-text-response-'+i).val());
        };

        function get(name) {
          if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
            return decodeURIComponent(name[1]);
        } //courtesy StackOverflow user Rafael http://stackoverflow.com/questions/831030/how-to-get-get-request-parameters-in-javascript

        var workerID = get('workerID');

        trial_data.workerID = workerID;
        trial_data.q1 = question_data[0];
        trial_data.q2 = question_data[1];
        trial_data.q3 = question_data[2];
        trial_data.q4 = question_data[3];
        trial_data.q5 = question_data[4];
        save_data([trial_data])
          
        display_element.html('');

        // next trial
        jsPsych.finishTrial();
      });

      $('#jspsych-instructions-back').on('click', function() {
              clear_button_handlers();
              instructions();
      });
    }

    instructions();

  };

    return plugin;
  })();
})(jQuery);
