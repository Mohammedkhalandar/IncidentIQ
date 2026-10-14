package com.incidentiq.incident;
import org.slf4j.Logger;import org.slf4j.LoggerFactory;import org.springframework.scheduling.annotation.Scheduled;import org.springframework.stereotype.Component;
@Component public class SlaScheduler {private static final Logger log=LoggerFactory.getLogger(SlaScheduler.class);private final IncidentService service;public SlaScheduler(IncidentService s){service=s;}@Scheduled(fixedDelayString="${SLA_CHECK_DELAY_MS:60000}") public void check(){try{service.checkSla();}catch(Exception e){log.error("SLA check failed",e);}}}
