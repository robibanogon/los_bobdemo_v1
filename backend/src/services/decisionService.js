const { v4: uuidv4 } = require('uuid');
const fileStorage = require('../utils/fileStorage');
const auditService = require('./auditService');
const applicationService = require('./applicationService');

class DecisionService {
  async submitRecommendation(applicationId, recommendationData, userId, userName) {
    const application = await fileStorage.findById('applications', applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    // Check if decision already exists
    let decision = await this.getByApplication(applicationId);
    
    if (decision && decision.is_final) {
      throw new Error('Decision is already finalized and cannot be modified');
    }

    const decisionData = {
      id: decision ? decision.id : uuidv4(),
      application_id: applicationId,
      recommended_by: userId,
      recommended_decision: recommendationData.recommended_decision,
      recommendation_notes: recommendationData.recommendation_notes || '',
      recommended_at: new Date().toISOString(),
      approver_id: null,
      final_decision: null,
      conditions: [],
      rejection_reason: null,
      decided_at: null,
      is_final: false
    };

    if (decision) {
      // Update existing decision
      const result = await fileStorage.update('decisions', decision.id, decisionData);
      
      await auditService.log({
        actor_id: userId,
        actor_name: userName,
        action: auditService.ACTIONS.SUBMIT_RECOMMENDATION,
        entity_type: 'Decision',
        entity_id: decision.id,
        before: decision,
        after: result.new
      });
      
      return result.new;
    } else {
      // Create new decision
      await fileStorage.append('decisions', decisionData);
      
      await auditService.log({
        actor_id: userId,
        actor_name: userName,
        action: auditService.ACTIONS.SUBMIT_RECOMMENDATION,
        entity_type: 'Decision',
        entity_id: decisionData.id,
        after: decisionData
      });
      
      return decisionData;
    }
  }

  async finalizeDecision(applicationId, finalDecisionData, userId, userName) {
    const application = await fileStorage.findById('applications', applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    let decision = await this.getByApplication(applicationId);
    
    if (!decision) {
      throw new Error('No recommendation found. Analyst must submit recommendation first.');
    }

    if (decision.is_final) {
      throw new Error('Decision is already finalized');
    }

    const updates = {
      approver_id: userId,
      final_decision: finalDecisionData.final_decision,
      conditions: finalDecisionData.conditions || [],
      rejection_reason: finalDecisionData.rejection_reason || null,
      decided_at: new Date().toISOString(),
      is_final: true
    };

    const result = await fileStorage.update('decisions', decision.id, updates);

    // Update application status
    if (finalDecisionData.final_decision === 'Approved') {
      await applicationService.approve(applicationId, userId, userName);
      
      await auditService.log({
        actor_id: userId,
        actor_name: userName,
        action: auditService.ACTIONS.APPROVE_APPLICATION,
        entity_type: 'Decision',
        entity_id: decision.id,
        before: decision,
        after: result.new
      });
    } else if (finalDecisionData.final_decision === 'Rejected') {
      await applicationService.reject(applicationId, userId, userName);
      
      await auditService.log({
        actor_id: userId,
        actor_name: userName,
        action: auditService.ACTIONS.REJECT_APPLICATION,
        entity_type: 'Decision',
        entity_id: decision.id,
        before: decision,
        after: result.new
      });
    }

    return result.new;
  }

  async getByApplication(applicationId) {
    const decisions = await fileStorage.read('decisions');
    return decisions.find(d => d.application_id === applicationId);
  }

  async getById(id) {
    const decision = await fileStorage.findById('decisions', id);
    
    if (!decision) {
      throw new Error('Decision not found');
    }

    return decision;
  }

  async addCondition(decisionId, condition, userId, userName) {
    const decision = await this.getById(decisionId);

    if (decision.is_final) {
      throw new Error('Cannot modify finalized decision');
    }

    const conditions = [...decision.conditions, condition];
    const result = await fileStorage.update('decisions', decisionId, { conditions });

    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: 'ADD_CONDITION',
      entity_type: 'Decision',
      entity_id: decisionId,
      before: { conditions: decision.conditions },
      after: { conditions }
    });

    return result.new;
  }

  async removeCondition(decisionId, conditionIndex, userId, userName) {
    const decision = await this.getById(decisionId);

    if (decision.is_final) {
      throw new Error('Cannot modify finalized decision');
    }

    const conditions = decision.conditions.filter((_, index) => index !== conditionIndex);
    const result = await fileStorage.update('decisions', decisionId, { conditions });

    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: 'REMOVE_CONDITION',
      entity_type: 'Decision',
      entity_id: decisionId,
      before: { conditions: decision.conditions },
      after: { conditions }
    });

    return result.new;
  }

  async overrideDecision(decisionId, overrideData, userId, userName) {
    // Admin only - allows modifying finalized decisions
    const decision = await this.getById(decisionId);

    const result = await fileStorage.update('decisions', decisionId, {
      ...overrideData,
      overridden_by: userId,
      overridden_at: new Date().toISOString()
    });

    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: 'OVERRIDE_DECISION',
      entity_type: 'Decision',
      entity_id: decisionId,
      before: decision,
      after: result.new
    });

    return result.new;
  }
}

module.exports = new DecisionService();

// Made with Bob
