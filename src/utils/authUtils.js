// The idea is that following functions returns the minimum rights. Eg. admin has also responsible rights
// and responsible has expert rights. If no rights are asked, it assumed that user has a browser role.
// In Kaavapino MVP is is decided that following rights are used: ('browse', 'Selaaja'), ('edit', 'Asiantuntija'), 
// ('create', 'Vastuuhenkilö'), ('admin', 'Pääkäyttäjä'),

const ADMIN = 'admin'
const EXPERT = 'edit'
const RESPONSIBLE = 'create'

// Asiantuntija, projektin vastuuhenkilö, pääkäyttäjä
const isExpert = (currentUserId, users) => {
  const userRole = getUserRole(currentUserId, users)
  return userRole === EXPERT || userRole === RESPONSIBLE || userRole === ADMIN 
}

// Projektin vastuuhenkilö, pääkäyttäjä
const isResponsible = (currentUserId, users) => {
  const userRole = getUserRole(currentUserId, users)
  return userRole === RESPONSIBLE || userRole === ADMIN 
}
// Pääkäyttäjä
const isAdmin = (currentUserId, users) => {
  const userRole = getUserRole(currentUserId, users)
  return userRole === ADMIN 
}

const getAdId = (currentUserId, users) => {
  let ad
  if (users) {
    users.forEach(user => {
      if (user.id === currentUserId) {
        ad = user.ad_id
        return
      }
    })
  }
  return ad 
}

const getUserRole = (currentUserId, users) => {
  let privilege
  if (users) {
    users.forEach(user => {
      if (user.id === currentUserId) {
        privilege = user.privilege
        return
      }
    })
  }
  return privilege
}

export default {
  isAdmin,
  isExpert,
  isResponsible,
  getAdId
}
