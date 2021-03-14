const App = require('../model/app')
const Version = require('../model/version')
const Team = require('../model/team')
const TeamMembers = require('../model/team_members')

/**
	 * 判断是否为空
	 * @param obj value 
	 */
 function isEmpty(value) {
  if (value == null || value == "undefined" || value == undefined) {
    return true;
  } else {
    return false;
  }
}

/**
 * 删除对象中所有值为空的属性
 * @param obj obj 
 */
 function removePropertyOfNull(obj) {
  Object.keys(obj).forEach(item => {
    if (this.isEmpty(obj[item])) delete obj[item]
  })
  return obj;
}

function isEmail(str){
    var re=/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
  if (re.test(str) != true) {
    return false;
  }else{
    return true;
  }
}

async function appAndUserInTeam(appId,teamId,userId) {
  const team = await Team.findOne({
    where: {
    id: teamId,
    creatorId: userId,
    }
  })
  const app = await App.findOne({
    where: {id:appId,creatorId:team.userId}
  })
  if (!app) {
      return {
        status: 408,
        msg: '应用不存在或您不在该团队中'
    }
  }else{
      return app
  }
}

async function userInTeamIsManager(userId,teamId) {
  const team = await Team.findOne({
    where: {
        id: teamId,
        creatorId: userId,
    }
})
  return team
}

async function userInTeam(userId,teamId) {
  const team = await TeamMembers.findOne({
    where: {
    id: teamId,
    creatorId: userId,
    }
})
 
  return team
}


module.exports = { isEmpty,removePropertyOfNull,isEmail,userInTeamIsManager,userInTeam }