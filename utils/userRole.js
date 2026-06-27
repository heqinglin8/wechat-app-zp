var ROLE = {
  RECRUITER: '1',
  JOB_SEEKER: '2',
  ADMIN: '100',
  SUPER_ADMIN: '1000'
};

var BOTTOM_TAB = {
  RECRUIT: 'recruit',
  JOB_SEEKER: 'jobSeeker'
};

function normalizeRole(role) {
  return role == null ? '' : String(role).trim();
}

function isEmptyRole(role) {
  var roleText = normalizeRole(role);
  return roleText === '' || roleText === '0';
}

function isAdminRole(role) {
  var roleText = normalizeRole(role);
  return roleText === ROLE.ADMIN || roleText === ROLE.SUPER_ADMIN;
}

function isRecruiterRole(role) {
  return normalizeRole(role) === ROLE.RECRUITER;
}

function isJobSeekerRole(role) {
  return normalizeRole(role) === ROLE.JOB_SEEKER;
}

function canPublishRecruit(role) {
  return isRecruiterRole(role) || isAdminRole(role);
}

function canPublishJobSeeker(role) {
  return isJobSeekerRole(role) || isAdminRole(role);
}

function resolvePublishActive(role) {
  return isAdminRole(role) ? 1 : 0;
}

function resolveBottomTab(role) {
  return isJobSeekerRole(role) ? BOTTOM_TAB.JOB_SEEKER : BOTTOM_TAB.RECRUIT;
}

function getRoleInfo(role) {
  var roleText = normalizeRole(role);
  return {
    role: roleText,
    isEmpty: isEmptyRole(roleText),
    isAdmin: isAdminRole(roleText),
    isRecruiter: isRecruiterRole(roleText),
    isJobSeeker: isJobSeekerRole(roleText),
    canPublishRecruit: canPublishRecruit(roleText),
    canPublishJobSeeker: canPublishJobSeeker(roleText),
    publishActive: resolvePublishActive(roleText),
    bottomTab: resolveBottomTab(roleText),
    showRecruitEntry: canPublishRecruit(roleText),
    showJobSeekerEntry: canPublishJobSeeker(roleText)
  };
}

function getRoleDisplayName(role) {
  var roleText = normalizeRole(role);
  if (isRecruiterRole(roleText) || roleText.indexOf('招') >= 0) {
    return '招聘者';
  }
  if (isJobSeekerRole(roleText) || roleText.indexOf('求职') >= 0) {
    return '求职者';
  }
  return roleText || '未知身份';
}

function getCurrentUserRole(Bmob) {
  var currentUser = Bmob && Bmob.User ? Bmob.User.current() : null;
  if (!currentUser || !currentUser.objectId) {
    return Promise.resolve('');
  }

  var cachedRole = normalizeRole(currentUser.role);
  var query = Bmob.Query('_User');
  query.equalTo('objectId', '==', currentUser.objectId);
  return query.find().then(function (results) {
    return results && results.length && results[0].role != null
      ? normalizeRole(results[0].role)
      : cachedRole;
  }).catch(function () {
    return cachedRole;
  });
}

module.exports = {
  ROLE: ROLE,
  BOTTOM_TAB: BOTTOM_TAB,
  normalizeRole: normalizeRole,
  isEmptyRole: isEmptyRole,
  isAdminRole: isAdminRole,
  isRecruiterRole: isRecruiterRole,
  isJobSeekerRole: isJobSeekerRole,
  canPublishRecruit: canPublishRecruit,
  canPublishJobSeeker: canPublishJobSeeker,
  resolvePublishActive: resolvePublishActive,
  resolveBottomTab: resolveBottomTab,
  getRoleInfo: getRoleInfo,
  getRoleDisplayName: getRoleDisplayName,
  getCurrentUserRole: getCurrentUserRole
};
