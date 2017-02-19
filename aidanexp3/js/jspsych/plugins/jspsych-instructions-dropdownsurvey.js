
/* This plugin displays text (including HTML formatted strings) during the experiment.
 * Then it displays a survey, and allows navigation back to the instructions. If the
 * answers are not correct, it will not let the participant proceed.
 */
(function($) {
    jsPsych['instructions-dropdownsurvey'] = (function() {

        var plugin = {};

        plugin.create = function(params) {

            //params = jsPsych.pluginAPI.enforceArray(params, ['data']);

            var trials = [];
            for (var i = 0; i < params.questions.length; i++) {
                var rows = [],
                    cols = [];
                if (typeof params.rows == 'undefined' || typeof params.columns == 'undefined') {
                    for (var j = 0; j < params.questions[i].length; j++) {
                        cols.push(40);
                        rows.push(1);
                    }
                }

                trials.push({
                    instructions: params.instructions,
                    preamble: typeof params.preamble == 'undefined' ? "" : params.preamble[i],
                    questions: params.questions[i],
                    answers: params.answers[i],
                    correct: params.correct[i],
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

            function instructions() {
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

            function survey() {
                display_element.html('');
                // show preamble text
                display_element.append($('<div>', {
                    "id": 'jspsych-survey-likert-preamble',
                    "class": 'jspsych-survey-likert-preamble'
                }));

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
                    for (k = 0; k < answers.length; k++) {
                        ans += "<option value='" + k + "'>" + answers[k] + "</option>"
                    }
                    // add text box
                    $("#jspsych-survey-text-" + i).append('<select id="jspsych-survey-text-response-' + i + '">' + ans + '</select>');

                }

                var nav_html = "<div class='jspsych-instructions-nav'>";
                nav_html += "<button id='jspsych-instructions-back'>&lt; Back to instructions</button>";
                nav_html += "<button id='jspsych-instructions-next'>Submit Answers &gt;</button>";
                display_element.append(nav_html);
                // add submit button
                $("#jspsych-instructions-next").click(function() {

                    var question_data = [];
                    for (var i = 0; i < trial.questions.length; i++) {
                        question_data.push($('#jspsych-survey-text-response-' + i).val());
                    };

                    can_proceed = true;
                    for (var i = 0; i < trial.questions.length; i++) {
                        if (question_data[i] != trial.correct[i]) {
                            can_proceed = false;
                        }
                    }

                    if (can_proceed) {
                        display_element.html('');

                        // next trial
                        jsPsych.finishTrial();
                    } else {
                        alert("One or more of your answers is incorrect. You cannot proceed until all of your answers are correct. You can revisit the instructions page if you wish.");
                    }
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