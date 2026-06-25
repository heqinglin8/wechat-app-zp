var util = require('./util');

function firstText() {
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function salaryText(item) {
  var unit = firstText(item.payType) === '1' ? '元/天' : '元/月';
  var min = Number(firstText(item.detPayMin));
  var max = Number(firstText(item.detPayMax));
  var hasMin = !isNaN(min) && min > 0;
  var hasMax = !isNaN(max) && max > 0;
  var formatMonthly = function (value) {
    if (value >= 1000) {
      var k = value / 1000;
      return (k % 1 === 0 ? String(k) : String(Number(k.toFixed(1)))) + 'k';
    }
    return String(value);
  };
  if (hasMin && hasMax) {
    if (max >= 10000 && min < 1000) return formatMonthly(max) + unit;
    return formatMonthly(min) + '-' + formatMonthly(max) + unit;
  }
  if (hasMax) return formatMonthly(max) + unit;
  if (hasMin) return formatMonthly(min) + unit;
  return '待补充薪资';
}

function compactTags(tags) {
  return (tags || []).filter(function (tag) {
    return tag && String(tag).trim();
  });
}

function splitTags(value) {
  var text = firstText(value);
  if (!text) return [];
  return text.split('|').map(function (tag) {
    return String(tag).trim();
  }).filter(function (tag) {
    return !!tag;
  });
}

function splitPhotoUrls(value, maxCount) {
  var text = firstText(value);
  if (!text) return [];
  return text.split('|').map(function (photo) {
    return util.toDisplayUrl(String(photo).trim());
  }).filter(function (photo) {
    return !!photo;
  }).slice(0, maxCount || 3);
}

function decorateJobCard(item) {
  item = item || {};
  var recruiter = firstText(item.commitUsername, '未写招聘者姓名');
  var recruiterRole = firstText(item.commitJobRole, '未写招聘者职位');
  var jobDirections = splitTags(item.jobDirection);
  item.cardTitle = firstText(item.title, '未写标题');
  item.cardSalary = salaryText(item);
  item.cardCompany = firstText(item.companyName, '未写公司名称');
  item.cardCompanySize = firstText(item.companyPeople, '未写规模');
  item.cardFinancing = firstText(item.financeStage, '未写融资');
  item.cardExperience = firstText(item.experience, '未写经验');
  item.cardEducation = firstText(item.education, '未写学历');
  item.cardDirection = firstText(jobDirections[0], '未写方向');
  item.cardTags = compactTags([
    item.cardExperience,
    item.cardEducation
  ].concat(jobDirections));
  item.cardRecruiter = recruiter
    ? recruiter + ' · ' + recruiterRole
    : '未写招聘者 · ' + recruiterRole;
  item.cardLocation = firstText(item.cityDisplayName, item.cityName, '未写地点');
  item.cardBadge = item.payType == 1 ? '临' : '';
  item.avatar = util.toDisplayUrl(item.commitAvatar) ? util.toDisplayUrl(item.commitAvatar) : item.firstPhoto;
  return item;
}

function decorateJobCards(list) {
  return (list || []).map(decorateJobCard);
}

function decorateJobSeekerCard(item) {
  item = item || {};
  var recoName = firstText(item.recoName, '未写发布人');
  var recruiterRole = firstText(item.commitJobRole, '');
  item.cardTitle = firstText(item.title, item.recoJobIntent, '未写标题');
  item.cardSalary = salaryText(item);
  item.cardSummary = firstText(item.summary, '未写摘要');
  item.cardFinancing = firstText(item.recoEducation, '未写学历');
  item.cardTags = compactTags([
    firstText(item.recoEducation, '')
  ].concat(splitTags(item.recoJobIntent)));
  item.cardSeeker = recruiterRole ? recoName + ' · ' + recruiterRole : recoName;
  item.cardLocation = firstText(item.cityDisplayName, item.cityName, '未写地点');
  item.cardBadge = item.payType == 1 ? '临' : '';
  item.cardPhotos = splitPhotoUrls(item.photoImgs, 3);
  item.avatar = util.toDisplayUrl(item.seekerAvatar) ? util.toDisplayUrl(item.seekerAvatar) : item.firstPhoto;
  return item;
}

function decorateJobSeekerCards(list) {
  return (list || []).map(decorateJobSeekerCard);
}

module.exports = {
  firstText: firstText,
  salaryText: salaryText,
  compactTags: compactTags,
  splitTags: splitTags,
  splitPhotoUrls: splitPhotoUrls,
  decorateJobCard: decorateJobCard,
  decorateJobCards: decorateJobCards,
  decorateJobSeekerCard: decorateJobSeekerCard,
  decorateJobSeekerCards: decorateJobSeekerCards,
};
