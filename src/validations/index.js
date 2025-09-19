const authValidation = require('./authValidation');
const levelValidation = require('./levelValidation');
const activityValidation = require('./activityValidation');
const dashValidation = require('./dashboardValidation');
const reportsValidation = require('./reportsValidation');
const templateValidation = require('./activityTemplateValidation');
const userValidation = require('./userValidation');
const inviteValidation = require('./inviteValidation');
const planValidation = require('./planValidation');

module.exports = {
  authValidation,
  levelValidation,
  activityValidation,
  dashValidation,
  reportsValidation,
  templateValidation,
  userValidation,
  inviteValidation,
  planValidation,
};