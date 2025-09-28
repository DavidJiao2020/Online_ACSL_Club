Application:
    pages:
        login
            enter name: (enter_name)
            start button (start_button)
        problemset (problemset_page)
            evaluate (evaluate)
                attempt # button (attempt_#)
                new attempt button (new_attempt)
            simplify
            ...
        problems (problems_page)
            show problems and answers
                multiple choice
            submit button (if new attempt) (submit_button)
            return button (if past attempt) (return button)




How to Update App:

1. Create app
2. Create Docker Image
    Create Dockerfile: 
    Build Docker Image: 
        >docker image build -t davidjiao/boolean_algebra_practice:v1 .
        # -t = tag, start with username / app_name : tag(version)
        # '.' to find Dockerfile at current dir.
    Upload Docker Image: Docker Desktop push to Docker Pub
3. Deploy Docker Image
    Log in to ionos (vps): ssh root@74.208.133.115
    # (root@ip)
    Password: 9S3U5xXc
    #password found in my vps on ionos web
    stop all previously running docker:
        >docker ps
        >docker stop {id}
    start new docker image
        >docker run -p 80:3000 davidjiao/boolean_algebra_practice:v1 &
        # -p = port mapping (3000 to 80)
        # & = background run
4. Test in Browser
    site name: ajacy.org
    alternative: 74.208.133.115