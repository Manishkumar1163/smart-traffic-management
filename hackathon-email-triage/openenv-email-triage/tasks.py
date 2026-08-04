from environment import EmailEnv, Email

class BaseGrader:
    def grade(self, env: EmailEnv) -> float:
        raise NotImplementedError

class EasyTaskGrader(BaseGrader):
    def grade(self, env: EmailEnv) -> float:
        score = 0.0
        total = 3.0
        
        e1 = env.emails_dict.get("e1") # Spam
        if e1 and e1.category == "spam": score += 1
        
        e2 = env.emails_dict.get("e2") # Work
        if e2 and e2.category == "work": score += 1
            
        e3 = env.emails_dict.get("e3") # Personal
        if e3 and e3.category == "personal": score += 1
            
        return score / total

class MediumTaskGrader(BaseGrader):
    def grade(self, env: EmailEnv) -> float:
        score = 1.0 # Base score: start with perfect, penalize mistakes
        
        # Must mark m1 and m2 as priority
        m1 = env.emails_dict.get("m1")
        if m1 and not m1.priority_flag:
            score -= 0.5
            
        m2 = env.emails_dict.get("m2")
        if m2 and not m2.priority_flag:
            score -= 0.5
            
        return max(0.0, score)

class HardTaskGrader(BaseGrader):
    def grade(self, env: EmailEnv) -> float:
        score = 0.0
        total_required_replies = 2.0
        
        # Needs to professionally reply to h1 and h2
        for e_id in ["h1", "h2"]:
            e = env.emails_dict.get(e_id)
            if e and e.status == "replied" and e.reply_text:
                text = e.reply_text.lower()
                # Basic check for professional tone
                if len(text) > 20 and any(formal in text for formal in ["regards", "sincerely", "best", "apologies", "thank"]):
                    score += 1.0
                    
        return min(1.0, score / total_required_replies)

def get_easy_env():
    emails = [
        Email(id="e1", sender="viagra@spam.com", subject="Cheap deals", content="Buy pills now! 90% off.", urgency="low"),
        Email(id="e2", sender="boss@corp.com", subject="Q3 Report", content="Please review the attached Q3 financial report by EOD.", urgency="high"),
        Email(id="e3", sender="mom@home.com", subject="Dinner", content="Are we still on for dinner this Sunday?", urgency="low")
    ]
    return EmailEnv(emails, max_steps=5), EasyTaskGrader()

def get_medium_env():
    emails = [
        Email(id="m1", sender="ceo@corp.com", subject="URGENT: Server Down", content="The main production server is down. Fix it immediately.", urgency="high"),
        Email(id="m2", sender="client@enterprise.com", subject="Critical SLA Breach", content="Your service has been down for 4 hours. We are losing money. Call us NOW.", urgency="high"),
        Email(id="m3", sender="newsletter@tech.com", subject="Weekly Tech News", content="Here are the top 10 trends you missed this week in AI...", urgency="low")
    ]
    return EmailEnv(emails, max_steps=6), MediumTaskGrader()

def get_hard_env():
    emails = [
        Email(id="h1", sender="angry_customer@domain.com", subject="I want a refund NOW", content="This product is terrible. It broke on day one. Give me my money back immediately or I am leaving a 1 star review.", urgency="high"),
        Email(id="h2", sender="vendor@supplier.com", subject="Invoice Overdue", content="Your last invoice is 30 days overdue. We will halt shipments tomorrow if not paid.", urgency="high"),
        Email(id="h3", sender="hr@corp.com", subject="Mandatory Training", content="Please complete your mandatory security training by next Friday.", urgency="normal")
    ]
    return EmailEnv(emails, max_steps=8), HardTaskGrader()
