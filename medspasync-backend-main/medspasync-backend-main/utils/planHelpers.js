function isProfessional(user) {
  return user && user.planType === 'professional';
}

module.exports = { isProfessional };
