const { Router } = require('express')
const { getAssignmentById, Assignment, AssignmentClientFields } = require('../models/assignment')
const { requireInstructorMatchesBody } = require('../models/user')
const { ValidationError } = require('sequelize')
const { requireAuthentication } = require('../lib/auth')

const router = Router()

router.get("/:assignmentId", async function (req, res, next) {
  try {
    const user = await getAssignmentById(req.params.assignmentId)
    if (user) {
      res.status(200).send(user)
    } else {
      next()
    }
  } catch(e) {
    next(e)
  }
})



/*
 * Route to add a new assignment.
 */
router.post(
  '/', 
  requireAuthentication, 
  requireInstructorMatchesBody, 
  async function (req, res, next) {
    try {
      const assignment = await Assignment.create(req.body, AssignmentClientFields)
      res.status(201).send({ id: assignment.id })
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: "Request body must contain courseId, title, due, and points" })
      } else {
        next(e)
      }
    }
  }
)


/*
 * Route to update data for an assignment.
 */
router.patch(
  '/:assignmentId', 
  requireAuthentication, 
  requireInstructorMatchesBody, 
  async function (req, res, next) {
    const assignmentId = req.params.assignmentId

    // Check request body is present and there is at least one matching field, otherwise return error
    const matchingFields = Object.keys(req.body)?.filter(value => AssignmentClientFields.includes(value));
    if (!req.body || matchingFields.length === 0) {
      res.status(400).send({ error: "Request must contain fields to update: courseId, title, points, or due" })
    }

    try {
      const result = await Assignment.update(req.body, {
        where: { id: assignmentId },
        fields: AssignmentClientFields
      })
      if (result[0] > 0) {
        // Assignment successfully updated
        res.status(200).send()
      } else {
        // No assignment with specified id exists, return 404 error
        next()
      }
    } catch (e) {
      next(e)
    }
  }
)


/*
 * Route to delete an assignment.
 */
router.delete(
  '/:assignmentId', 
  requireAuthentication, 
  requireInstructorMatchesBody, 
  async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const result = await Assignment.destroy({ where: { id: assignmentId }})
      if (result > 0) {
        res.status(204).send()
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
  }
)


module.exports = router